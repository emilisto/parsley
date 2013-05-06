var  _ = require('underscore')
  , logging = require('./logging')
  , uuid = require('uuid')
  , util = require('util')
  , common = require('./common')
  , serialize = require('./serialize')
  , key = common.redisKey
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

  if(_.isFunction(task)) task = new Task(task);

  if(task) {
    this.task = task;

    this.id = uuid.v4().toString();
    this.status = 'idle';
    this.addArguments(argumentsToArray(arguments).slice(1));

    this.log('debug', 'created command %s', this.id);
  }

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

    Runner.run(this.task.fn, this.arguments, function(err, ret) {

      if(err) {
        this.error = serialize.serializeException(err);
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

      result.publish(this.error, ret);

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

  save: function(callback) {
    var key = this.key();
    var data = this.serialize();
    var redisData = _.reduce(data, function(total, field, value) {
      return total.concat([ value, JSON.stringify(field) ]);
    }, []);

    this._saveCallbacks();

    var args = [ key ].concat(redisData);
    this.redis.hmset(args, callback || function() {});

    this.log('debug', 'saved %s', key);
  },

  /*
   * Returns a JSON serialized version of this command containing
   * everything a worker needs to know to create one just like it.
   */
  serialize: function() {

    var data = _.extend({
      id         : this.id,
      arguments  : this.arguments,
      status     : this.status,
      task       : this.task.serialize(),
      result     : this.result,
      error      : this.error
    }, this._serializeCallbacks());

    return JSON.parse(JSON.stringify(data));
  }

});

Command.fetch = function(id, callback) {
  var r = redis.get();

  var logger = logging.getLogger('Parsley.Task');
  logger.log('debug', 'fetching command %s', id);

  r.hgetall(key('command', id), function(err, data) {
    if(err) return callback(err);

    data = _.object(
      _.keys(data),
      _.map(_.values(data), JSON.parse)
    );

    var command = Command.deserialize(data);
    callback(null, command);
  });
};

Command.deserialize = function(data) {

  var command = new Command();

  command.task            = Task.deserialize(data.task);
  command.id              = data.id;
  command.arguments       = data.arguments || [];
  command.status          = data.status;

  // FIXME: what to do with these? right now we don't dereference
  command.callbacks       = data.callbacks || [];
  command.error_callbacks = data.error_callbacks || [];
  command.commandset      = data.commandset;
  command.result          = data.result;
  command.error           = data.error;

  return command;
};

Command.make = function(obj) {
  var command;
  if(obj instanceof Command) {
    command = obj;
  } else if(obj instanceof Task) {
    command = new Command(obj);
  } else if(_.isFunction(obj)) {
    command = new Command(new Task(obj));
  } else {
    throw new Error('obj is of invalid type');
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
    command.chord = this;

    if(!this.commands) this.commands = [];
    this.commands.push(command);
    this.n_total = this.commands.length;
  },

  serialize: function() {
    return _.extend({
      id          : this.id,
      commands    : this._serializeCommands(this.commands),
      n_total     : this.n_total,
      n_completed : this.n_completed
    }, this._serializeCallbacks());
  },

  key: function() {
    return key('commandset', this.id)
  },

  // Identical to the Command's save method
  save: function(callback) {
    var key = this.key();

    var data = this.serialize();
    var redisData = _.reduce(data, function(total, field, value) {
      return total.concat([ value, JSON.stringify(field) ]);
    }, []);

    var multi = this.redis.multi();

    var commandset = this;
    _.reduce(this.commands, function(multi, command) {
      var value = JSON.stringify(commandset.id);
      return multi.hset(command.key(), 'commandset', value);
    }, multi);

    multi
      .hmset([ key ].concat(redisData))
      .exec(callback || function() {});

    this._saveCallbacks();

    this.log('debug', 'saved commandset %s', key);

  },

  get: function(cb) {
    var command = new Command(function(results) {
      console.log('I am called');
      console.log(arguments);
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

var logger = logging.getLogger('Parsley.CommandSet');

CommandSet.fetch = function(id, callback) {
  var r = redis.get();

  var _key = key('commandset', id);
  logger.log('debug', 'fetching commandset from ', _key);
  r.hgetall(_key, function(err, data) {
    if(err) return callback(err);
    data = _.object(_.keys(data), _.map(_.values(data), JSON.parse));
    var obj = CommandSet.deserialize(data);
    callback(null, obj);
  });
};

CommandSet.deserialize = function(data) {
  var commandset = new CommandSet();

  commandset.id              = data.id;
  commandset.n_completed     = data.n_completed;
  commandset.n_total         = data.n_total;
  commandset.callbacks       = data.callbacks || [];
  commandset.error_callbacks = data.error_callbacks || [];
  commandset.commands        = data.commands || [];

  return commandset;
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
