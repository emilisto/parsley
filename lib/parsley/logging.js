var winston = require('winston');
var _ = require('underscore');

var container = new winston.Container();

var config = {
  transports: {
    console: {
      level: 'debug',
      colorize: 'true'
    }
  }
};

// FIXME: find some way to disable logging, e.g. when running tests

module.exports = {

  container: container,
  getLogger: function(label) {
    var logger = container.add(label, config.transports);
    return logger;
  },
  config: config

};
