var _ = require('underscore')
  , winston = require('winston')
  , colors = require('colors')
  , util = require('util');

var Parsley = (function() {

  var TaskMessage = function(task, args) {
    var name = task.fn.name;
  };

  var Task = function Task(fn) {
    this.fn = fn;
    this._makeLogger();
    this.logger.debug('created task');
  };

  _.extend(Task.prototype, {

    _makeLogger: function() {
      var fnName = this.fn.name;

      var logger = this.logger = new (winston.Logger)({
         transports: [ new (winston.transports.Console)({
           colorize: true,
           level: 'debug'
         }) ]
      });

      _.each(['debug', 'info', 'warning', 'error'], function(level) {
        var fn = logger[level];
        logger[level] = function() {
          var message = util.format.apply(null, arguments);
          var prefix = fnName || '<unnamed task>';
          fn(prefix.white + ': ' + message);
        };
      });

    },

    delay: function() {
      var self = this,
          args = arguments;

      setTimeout(function() {
        self.logger.info('delaying for a bit...');
        self.fn.apply(self, arguments);
      }, 0);

    }

  });

  var task = function(fn) {
    var task = new Task(fn);

    var ret = function() {
      // FIXME: think through this: do we really want to override the default
      // context for the task'ified function?
      return fn.apply(task, arguments);
    };
    // FIXME: is this nice?
    ret.__proto__ = task;

    return ret;
  };

  return {
    Task: Task,
    task: task
  };
}());

var looperTask = Parsley.task(function looperTask(arg) {
  var n = Math.random() * 10e7 | 0

  this.logger.info('looping %d times', n);

  for(i = 0; i < n; i++)
    ;
});

looperTask();
taskmessage = looperTask.delay(10);


//var exampleTask = new Task(function(arg) {

//});

//exports.tasks = {
  //exampleTask: exampleTask
//};
