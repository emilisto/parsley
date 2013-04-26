var _ = require('underscore')
  , logging = require('./logging');
;

var Task = function Task(fn) {

  var logger = logging.getLogger('Parsley.Task');
  logger.extend(this);

  // TODO: find a way to save where this task resides so that worker can
  // include it. (the "10.000 crown question")

  this.info('coool');
  this.fn = fn;
};


module.exports = Task;
