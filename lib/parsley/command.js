var  _ = require('underscore')
  , logging = require('./logging')
  , uuid = require('uuid')
  , util = require('util')
  , common = require('./common')
  , key = common.redisKey
  , redis = require('./redis')
  , Task = require('./task')
  , LinkableMixin = require('./linkable')
  //, Canvas = require('./chord')
  , DeferredResult = require('./deferredresult')
  , argumentsToArray = require('./common').argumentsToArray
  , EventEmitter2 = require('eventemitter2').EventEmitter2
;

// TODO: Create a global Command registry so we can store command id's as
// callbacks and fetch them on demand when saving.

// TODO: make saving more efficient, right now we always re-save the whole hash
// TODO: use Redis' MULTI command to make things more transaction-safe

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
  this.listener = redis.getListener();
};

util.inherits(Command, EventEmitter2);

_.extend(Command.prototype, LinkableMixin, {
  addArguments: function(args) {
    args = argumentsToArray(args || []);
    this.arguments = (this.arguments || []).concat(args);
  },

  dispatch: function() {
    if(!this.cq) {
      // FIXME: Maybe use a singleton for CommandQueue instead
      var CommandQueue = require('./commandqueue');
      this.cq = new CommandQueue();
      this.listen();
    }

    return this.cq.enqueue(this);
  },

  listen: function() {
    var self = this;
    var channel = key('command', 'finish', this.id);

    this.log('debug', 'listening to %s', channel);
    this.listener.subscribe(channel, function() {})
    this.listener.on('message', function(channel, ret) {
      if(channel === channel) {
        self.emit('finish', ret);
      }
    });

    return this;
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

    this.log('info', 'running command %s', this.id);

    try {
      var ret = this._run();
      this.status = 'finished';
      this.save();

      if(this.chord) {
        // TODO: confirm this task is done in the chord
      }

      result.publish(ret);
      this._dispatchCallbacks(ret);

    } catch(e) {
      this.log('error', 'unable to run command: ', e.toString());
      // TODO: run the error_callbacks
    }

    return this;
  },

  get: function(cb) {
    var result = new DeferredResult(this.id);
    return result.get(cb);
  },
  _run: function() {
    this.addArguments(arguments);
    var args = util.format(this.arguments);
    this.log('info', 'running with arguments: ' + args);
    return this.task.fn.apply(this, this.arguments);
  },

  save: function(callback) {

    var data = this.serialize();
    var redisData = _.reduce(data, function(total, field, value) {
      return total.concat([ value, JSON.stringify(field) ]);
    }, []);

    this._saveCallbacks();

    var args = [ key('command', this.id) ].concat(redisData);
    this.redis.hmset(args, callback || function() {});

    this.log('debug', 'saved %s', key('command', this.id));
  },

  /*
   * Returns a JSON serialized version of this command containing
   * everything a worker needs to know to create one just like it.
   */
  serialize: function() {

    var data = _.extend({
      id              : this.id,
      arguments       : this.arguments,
      status          : this.status,
      task            : this.task.serialize(),
      chord           : this.chord ? this.chord.serialize() : null
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

  //command.chord           = Chord.deserialize(data.chord);
  command.result          = DeferredResult.deserialize(command.id, data.result);

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

module.exports = Command;
