var  _ = require('underscore')
  , logging = require('./logging')
  , uuid = require('uuid')
  , util = require('util')
  , common = require('./common')
  // FIXME: rename serialize to serializer
  , Serializer = require('./serialize')
  , key = common.redisKey
  , stringifyOrNull = common.stringifyOrNull
  , parseOrNull = common.parseOrNull
  , redis = require('./redis')
  , Task = require('./task')
  , LinkableMixin = require('./linkable')
  , Runner = require('./runner')
  //, Canvas = require('./chord')
  , DeferredResult = require('./deferredresult')
  , argumentsToArray = require('./common').argumentsToArray
  , EventEmitter2 = require('eventemitter2').EventEmitter2
;

// TODO: Create a global Command registry so we can store command id's as
// callbacks and fetch them on demand when saving.

// TODO: make saving more efficient, right now we always re-save the whole hash
// TODO: use Redis' MULTI command to make things more transaction-safe

// Singleton pattern to avoid having multiple CommandQueue's
var enqueue = (function() {
  var cq;

  return function(command) {
    if(!cq) {
      // FIXME: Maybe use a singleton for CommandQueue instead
      var CommandQueue = require('./commandqueue');
      cq = new CommandQueue();
    }
    return cq.enqueue(command);
  };
}());

var Command = function Command(task) {

  EventEmitter2.call(this);

  var logger = logging.getLogger('Parsley.Task');
  logger.extend(this);


  if(task) {
    this.task = Task.make(task);
    this.name = this.task.name;

    this.id = uuid.v4().toString();
    this.status = 'idle';
    this.addArguments(argumentsToArray(arguments).slice(1));

    // FIXME: here, really?
    this.callbacks = this.callbacks || [];
    this.error_callbacks = this.error_callbacks || [];

    this.log('debug', 'created command %s', this.id);
  }

  this.serializer = new Serializer(this.serializationMap);

  this.redis = redis.get();
};

util.inherits(Command, EventEmitter2);

_.extend(Command.prototype, LinkableMixin, {
  addArguments: function(args) {
    args = argumentsToArray(args || []);
    this.arguments = (this.arguments || []).concat(args);
  },

  dispatch: function() {
    return enqueue(this);
  },

  clone: function() {
    // TODO: Create the same task but with a new id
  },

  /*
   * Invokes this command - used to run tasks in the worker, or for
   * immediate execution on client.
   */

  run: function() {
    var self = this;
    var result = new DeferredResult(this.id);

    var args = util.format(this.arguments);
    this.log('info', 'running command %s with arguments: %s', this.id, args);

    Runner.run(this.task.fn, this, this.arguments, function(err, ret) {

      if(err) {
        this.error = err;
        this.log('error', 'task %s failed with error: %s', this.id, this.error);
        this.status = 'failed';
        this._dispatchErrorCallbacks(ret);
      } else {
        this.status = 'finished';
        this._dispatchCallbacks(ret);
      }

      this.emit('finished', this);
      this.result = ret;
      this.save();

      // FIXME: what to do with the commandset when one task fails?
      if(this.commandset) {
        CommandSet.finishCommand(this.commandset, this);
      }

      // FIXME: The way we serialize the error for sending it of to
      // DeferredResult is sooo nasty. Basically, we want the error serialized
      // when sending to the pub/sub channel. Come up with a clearer data
      // format for the pub/sub instead.

      var error;
      if(this.error) {
        error = JSON.parse(this.serializer.serializeOne('error', this.error));
      }
      result.publish(error, ret);

    }.bind(this));

    return this;
  },

  get: function(cb) {
    var result = new DeferredResult(this.id);
    return result.get(cb);
  },

  key: function() {
    return key('command', this.id);
  },

  serializationMap: {
    'id'              : 'normal',
    'status'          : 'normal',
    'arguments'       : 'json',
    'result'          : 'json',
    'error'           : 'exception',
    'arguments'       : 'json',
    'callbacks'       : 'commands',
    'error_callbacks' : 'commands',

    'commandset': {
      'serialize': function(commandset) {
        return commandset.id ? commandset.id : commandset;
      },
      'deserialize': function(val) { return val; }
    },

    'task': {
      'serialize': function(task) {
        return JSON.stringify(task.serialize());
      },
      'deserialize': function(val) {
        return Task.deserialize(JSON.parse(val));
      }
    }
  }

});

///////
// .fetch() and .save() dual methods

Command.prototype.save = function(callback) {
  var key = this.key();
  var serializer = new Serializer(this.serializationMap);
  var data = this.serializer.serialize(this);

  this._saveCallbacks();
  this.redis.hmset(key, data, callback || function() {});

  this.log('debug', 'saved %s', key);

  return this;
};

// FIXME: put these in a separate directory for Lua files instead
redis.registerScript('fetch-command',
  'local commandData = redis.call("HGETALL", KEYS[1])\n' +
  'local commandSetId = redis.call("HGET", KEYS[1], "commandset")\n' +
  'local commandSet\n' +
  'if commandSetId then\n' +
    'commandSet = redis.call("HGETALL", "parsley:commandset:"..commandSetId)\n' +
  'end\n' +
  'return { commandData, commandSet }\n'
);

Command.prototype.fetch = function(id, callback) {
  var r = redis.get();
  var _key = key('command', id);
  var self = this;

  redis.runScript('fetch-command', 1, [ _key ], function(err, data) {
    if(err) return callback(err);

    var serialized = {
      'command'    : redis.replyToObject(data[0]),
      'commandset' : data[1] ? redis.replyToObject(data[1]) : null
    };

    _.extend(self, self.serializer.deserialize(serialized['command']));

    self.log('debug', 'fetched task %s(%s)', self.id, self.task.name);

    callback(null, self);

    // TODO: add the commandset to the command as well.

  });

};

Command.make = function(obj) {
  var command;
  if(obj instanceof Task) {
    command = new Command(obj);
  } else if(_.isFunction(obj)) {
    command = new Command(new Task(obj));
  } else {
    // FIXME: might not be a good idea. Problem is that instanceof doesn't work
    // with hiearchies.
    command = obj;
  }

  return command;
}

// Children can be functions, tasks, or arrays
var CommandSet = function(children) {

  _.bindAll(this, 'addCommand');

  // Make a chain of all tasks

  this.id = uuid.v4().toString();
  this.n_completed = 0;
  _.each(children || [], this.addCommand);

  var logger = logging.getLogger('Parsley.CommandSet');
  logger.extend(this);

  this.redis = redis.get();
  this.listener = redis.getListener();
};

_.extend(CommandSet.prototype, LinkableMixin, {

  addCommand: function(child) {
    var command = Command.make(child);
    command.commandset = this;

    if(!this.commands) this.commands = [];
    this.commands.push(command);
    this.n_total = this.commands.length;
  },

  key: function() {
    return key('commandset', this.id)
  },

  get: function(cb) {
    var command = new Command(function(results) {
      return results;
    });
    this.link(command);
    command.get(cb);
    return this;
  },

  _finishCommand: function(id) {

  },

  // FIXME: this could be done more efficient if we stored the results in the commandset instead
  _collectResults: function(cb) {
    var ids = this.commands;

    var multi = this.redis.multi();
    multi = _.reduce(ids, function(multi, commandId) {
      var _key = key('command', commandId);
      return multi.hget(_key, 'result');
    }, multi);

    multi.exec(function(err, results) {
      if(err) return cb(err);
      results = _.object(ids, results);
      console.log(results);
      cb(null, results);
    });

  },

  _finish: function() {
    var self = this;

    this.log('info', 'commandset %s finished', this.id);

    this._collectResults(function(err, results) {
      if(err) {
        self.log('error', 'unable to collect results from tasks in chord: %s', err);
        return;
      }
      self._dispatchCallbacks(results);
    });
  }

});

var CommandSetSerializer = new Serializer({
  'id'              : 'normal',
  'n_total'         : 'normal',
  'n_completed'     : 'normal',
  'callbacks'       : 'commands',
  'error_callbacks' : 'commands',
  'commands'        : 'commands'
});

///////
// .fetch() and .save() dual methods

CommandSet.prototype.save = function(callback) {
  var key = this.key(),
      id = this.id,
      data = CommandSetSerializer.serialize(this),
      multi = this.redis.multi();

  this._saveCallbacks();

  _.reduce(this.commands, function(multi, command) {
    return multi.hset(command.key(), 'commandset', id);
  }, multi);

  multi
    .hmset(key, data)
    .exec(callback || function() {});

  this.log('debug', 'saved commandset %s', key);

  return this;
};

CommandSet.fetch = function(id, callback) {
  var r = redis.get();
  var _key = key('commandset', id);

  r.hgetall(_key, function(err, data) {
    if(err) return callback(err);

    var commandset = new CommandSet();
    _.extend(commandset, CommandSetSerializer.deserialize(data));
    callback(null, commandset);
  });

};

// Performs a Redis operation that increases n_completed AND returns the new
// value of n_completed and n_total. This is atomic, so we can be sure nothing
// happened in between. This is used to atomically determine whether the
// CommandSet was completed or not.
//
// @id       : id of commandset
// @callback : function(err, n_total, n_completed)
//
var incrementAndGetCounts = function(id, callback) {

  var luaTemplate = _.template('\
local key = "<%= key %>" \
local n_total = tonumber(redis.call("HGET", key, "n_total")) \
local n_completed = tonumber(redis.call("HINCRBY", key, "n_completed", 1)) \
return { n_total, n_completed } \
');

  redis.get().eval(luaTemplate({ key: id }), 0, function(err, ret) {
    if(err) return callback(err);

    var n_total = ret[0] || 0,
        n_completed = ret[1] || 0;
    callback(null, n_total, n_completed);
  });

};

CommandSet.key = function(id) { return key('commandset', id); };

var logger = logging.getLogger('Parsley.CommandSet');

CommandSet.finishCommand = function(commandSetId, command) {

  logger.log('debug', 'marking command %s as finished in commandset %s', command.id, commandSetId);

  var key = CommandSet.key(commandSetId);
  incrementAndGetCounts(key, function(err, n_total, n_completed) {

    if(n_total === 0) {
      logger.log('error', 'commandset %s is empty', commandSetId);
      return;
    }

    logger.log('debug', 'commandset %s has n_total=%d and n_completed=%d',
               commandSetId, n_total, n_completed);

    // CommandSet is not finished yet
    if(n_completed < n_total) return;

    logger.log('info', 'commandset %s finished all %d commands', commandSetId, n_total);
    CommandSet.fetch(commandSetId, function(err, commandset) {
      commandset._finish();
    });

  })
};

module.exports = {
  Command: Command,
  CommandSet: CommandSet,
  incrementAndGetCounts: incrementAndGetCounts
};
