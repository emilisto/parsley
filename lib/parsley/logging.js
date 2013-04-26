var winston = require('winston')
  , _ = require('underscore')
  , util = require('util')
;

require('colors');

exports.getLogger = function(prefix) {

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

