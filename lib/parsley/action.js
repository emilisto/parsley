var  _ = require('underscore')
  , logging = require('./logging');
;

var argsToArr = function(args) { return Array.prototype.slice.call(args); };

var Action = function Action(task) {

  var logger = logging.getLogger('Parsley.Task');
  logger.extend(this);

  if(!task) throw new Error('must supply task');
  this.task = task;

  this.args = argsToArr(arguments).slice(1);

  this.debug('created');
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

    this.info('running with arguments: ', this.args);

    return this.task.fn.apply(this, this.args);
  },

  link: function() {

  }

});

module.exports = Action;

