var  _ = require('underscore')
  , logging = require('./logging')
  , uuid = require('uuid');
;

var argsToArr = function(args) { return Array.prototype.slice.call(args); };

var Action = function Action(task) {

  var logger = logging.getLogger('Parsley.Task');
  logger.extend(this);

  if(!task) throw new Error('must supply task');
  this.task = task;

  this.uuid = uuid.v4();
  this.args = argsToArr(arguments).slice(1);
  this.callbacks = [];

  this.log('debug', 'created action %s', this.uuid);
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

    this.info('running with arguments: ', this.args);

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
      uuid      : this.uuid,
      task      : this.task.serialize(),
      callbacks : this.callbacks
    }));
  }

});

module.exports = Action;

