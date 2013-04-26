var winston = require('winston');

exports.getLogger = function(prefix) {

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
      fn(prefix.white + ': ' + message);
    };
  });

  return logger;
}

