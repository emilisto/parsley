var  _ = require('underscore')
  , logging = require('./logging')
  , uuid = require('uuid')
  , util = require('util')
  , common = require('./common')
  , key = common.redisKey
  , redis = require('./redis')
  , Task = require('./task')
  , Chord = require('./chord')
  , DeferredResult = require('./deferredresult')
  , argumentsToArray = require('./common').argumentsToArray
;

// TODO: Create a global Command registry so we can store command id's as
// callbacks and fetch them on demand when saving.

// TODO: make saving more efficient, right now we always re-save the whole hash
// TODO: use Redis' MULTI command to make things more transaction-safe

var Command = function Command(task) {

  var logger = logging.getLogger('Parsley.Task');
  logger.extend(this);

  if(task) {
    this.task = task;

    this.id = uuid.v4().toString();
    this.callbacks = [];
    this.status = 'idle';
    this.error_callbacks = [];
    this.addArguments(argumentsToArray(arguments).slice(1));

    this.log('debug', 'created command %s', this.id);
  }

  this.redis = redis.get();
  this.listener = redis.getListener();
};

_.extend(Command.prototype, {
  addArguments: function(args) {
    args = argumentsToArray(args || []);
    this.arguments = (this.arguments || []).concat(args);
  },

  dispatch: function() {
    // Try to use a default message queue
    var result = new DeferredResult(this);
    return result;
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

    this.log('info', 'running command %s', this.id);

    var ret;
    try {
      ret = this._run();
    } catch(e) {
      this.log('error', 'unable to run command: ', e.toString());
      // TODO: run the error_callbacks
    }

    // FIXME: doesn't work
    //this.listener.publish(
      //common.redisKey('command', 'finish', this.id),
      //'bogus'
      ////JSON.stringify(this.serialize())
    //);

    this.result = ret;
    this.status = 'finished';
    this.save();

    this._dispatchCallbacks();

    if(this.chord) {
      // TODO: confirm this task is done in the chord
    }
  },

  _dispatchCallbacks: function() {
    var self = this;
    var dispatchCallback = function(args, id) {
      Command.fetch(id, function(err, command) {
        command.addArguments(args);
        command.save();
        self.log('debug', 'dispatching callback command %s', command.id);
        // FIXME: dispatch command to queue instead of running it locally
        command.run();
      });
    };

    if(this.callbacks.length > 0) {
      this.log('debug', 'invoking %d callback(s)', this.callbacks.length);
    }
    if(this.error_callbacks.length > 0) {
      this.log('debug', 'invoking %d error_callback(s)', this.error_callbacks.length);
    }

    var args = [ this.result ];
    _.each(this.callbacks, _.partial(dispatchCallback, args));
    _.each(this.error_callbacks, _.partial(dispatchCallback, args));

  },

  _run: function() {
    this.addArguments(arguments);
    var args = util.format(this.arguments);
    this.log('info', 'running with arguments: ' + args);
    return this.task.fn.apply(this, this.arguments);
  },

  _link: function(obj, which) {
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

    this[which].push(command);
  },
  link: function(obj) { this._link(obj, 'callbacks'); },
  link_error: function(obj) { this._link(obj, 'error_callbacks'); },

  saveCallbacks: function() {

    // FIXME: this is asynchronous, and there's a risk the task could finish
    // before the callbacks are saved. Make some kind of global buffer - or a
    // reference to .multi() that all methods use.

    var saveCallback = function(callback) {
      if(callback.save) callback.save();
    };
    _.each(this.callbacks || [], saveCallback);
    _.each(this.error_callbacks || [], saveCallback);
  },
  save: function(callback) {

    var data = this.serialize();
    var redisData = _.reduce(data, function(total, field, value) {
      return total.concat([ value, JSON.stringify(field) ]);
    }, []);

    this.saveCallbacks();

    var args = [ key('command', this.id) ].concat(redisData);
    this.redis.hmset(args, callback || function() {});

    this.log('debug', 'saved %s', key('command', this.id));
  },

  /*
   * Returns a JSON serialized version of this command containing
   * everything a worker needs to know to create one just like it.
   */

  serialize: function() {
    var serializeCallbacks = function(obj) {
      return _.map(obj || [], function(val) {
        return val.id ?  val.id : val;
      });
    };

    return JSON.parse(JSON.stringify({
      id              : this.id,
      arguments       : this.arguments,
      status          : this.status,
      task            : this.task.serialize(),
      result          : this.result, // ? this.result.serialize() : null,
      callbacks       : serializeCallbacks(this.callbacks),
      error_callbacks : serializeCallbacks(this.error_callbacks),
      chord           : this.chord ? this.chord.serialize() : null
    }));
  }

});

Command.fetch = function(id, callback) {
  var r = redis.get();
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

  command.chord           = Chord.deserialize(data.chord);
  command.result          = DeferredResult.deserialize(data.result);

  return command;
};

module.exports = Command;
