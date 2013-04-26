var getLogger = require('./logging').getLogger
  , _ = require('underscore')
;

var argsToArr = function(args) { return Array.prototype.slice.call(args); };

var Action = function Action(task) {

  if(!task) throw new Error('must supply task');
  this.task = task;

  this.logger = getLogger(this.constructor.name || 'unknown');
  this.args = argsToArr(arguments).slice(1);

  this.logger.debug('created');
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

    // FIXME: should we include more arguments here?

    this.logger.info('running with arguments: ', this.args);

    return this.task.fn.apply(this, this.args);
  }
});

module.exports = Action;

