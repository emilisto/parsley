var getLogger = require('./logging').getLogger
  , _ = require('underscore')
;

var Task = function Task(fn) {
  this.logger = getLogger(this.constructor.name);

  // TODO: find a way to save where this task resides so that worker can
  // include it. (the "10.000 crown question")

  this.fn = fn;
};

module.exports = Task;
