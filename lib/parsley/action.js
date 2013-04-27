var  _ = require('underscore')
  , logging = require('./logging')
  , uuid = require('uuid')
  , util = require('util')
  , Task = require('./task');
;

var argsToArr = function(args) { return Array.prototype.slice.call(args); };

var Action = function Action(task) {

  var logger = logging.getLogger('Parsley.Task');
  logger.extend(this);

  if(!task) throw new Error('must supply task');
  this.task = task;

  this.id = uuid.v4().toString();
  this.args = argsToArr(arguments).slice(1);
  this.callbacks = [];

  this.log('debug', 'created action %s', this.id);
};

_.extend(Action.prototype, {
  addArguments: function() {
    this.args = (this.args || []).concat(argsToArr(arguments));
  },

  /*
   * Invokes this action - used to run tasks in the worker, or for
   * immediate execution on client.
   */
  run: function() {

    this.addArguments.apply(this, arguments);

    var args = util.format(this.args);
    this.log('info', 'running with arguments: ' + args);

    return this.task.fn.apply(this, this.args);
  },

  link: function() {

  },

  /*
   * Returns a JSON serialized version of this action containing
   * everything a worker needs to know to create one just like it.
   */
  serialize: function() {
    return JSON.parse(JSON.stringify({
      args      : this.args,
      id        : this.id,
      task      : this.task.serialize(),
      callbacks : this.callbacks
    }));
  }

});

Action.deserialize = function(data) {
  var task = Task.deserialize(data.task);
  var action = new Action(task);

  action.id = data.id;
  action.callbacks = data.callbacks;
  action.args = data.args;

  return action;
};

module.exports = Action;

