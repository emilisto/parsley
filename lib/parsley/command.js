var  _ = require('underscore')
  , logging = require('./logging')
  , uuid = require('uuid')
  , util = require('util')
  , Task = require('./task')
  , Chord = require('./chord')
  , DeferredResult = require('./deferredresult')
  , argumentsToArray = require('./common').argumentsToArray
;

var Command = function Command(task) {

  var logger = logging.getLogger('Parsley.Task');
  logger.extend(this);

  if(task) {
    this.task = task;

    this.id = uuid.v4().toString();
    this.arguments = this.addArguments(argumentsToArray(arguments).slice(1));
    this.callbacks = [];
    this.error_callbacks = [];

    this.log('debug', 'created command %s', this.id);
  }
};

_.extend(Command.prototype, {
  addArguments: function(args) {
    args = argumentsToArray(args || []);
    this.arguments = (this.arguments || []).concat(args);
  },

  dispatch: function() {
    // Try to use a default message queue
  },

  clone: function() {
    // TODO: Create the same task but with a new id
  },

  /*
   * Invokes this command - used to run tasks in the worker, or for
   * immediate execution on client.
   */
  run: function() {

    this.addArguments.apply(this, arguments);

    var args = util.format(this.arguments);
    this.log('info', 'running with arguments: ' + args);

    return this.task.fn.apply(this, this.arguments);
  },

  link: function() {
    // FIXME: add task to callbacks
  },
  link_error: function() {
    // FIXME: add task to error_callbacks
  },

  /*
   * Returns a JSON serialized version of this command containing
   * everything a worker needs to know to create one just like it.
   */
  serialize: function() {
    return JSON.parse(JSON.stringify({
      id              : this.id,
      arguments       : this.arguments,
      status          : this.status,
      task            : this.task.serialize(),
      result          : this.result ? this.result.serialize() : null,
      callbacks       : _.invoke(this.callbacks || [], 'serialize'),
      error_callbacks : _.invoke(this.error_callbacks || [], 'serialize'),
      chord           : this.chord ? this.chord.serialize() : null
    }));
  }

});

Command.deserialize = function(data) {

  var command = new Command();

  command.task            = Task.deserialize(data.task);
  command.id              = data.id;
  command.arguments       = data.arguments;
  command.status          = data.status;

  command.callbacks       = _.map(data.callbacks || [], Command.deserialize);
  command.error_callbacks = _.map(data.error_callbacks || [], Command.deserialize);
  command.chord           = Chord.deserialize(data.chord);
  command.result          = DeferredResult.deserialize(data.result);

  return command;
};

module.exports = Command;
