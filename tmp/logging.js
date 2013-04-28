var winston = require('winston');

var container = new winston.Container({
  // Add more detailed options
});

var addLogger = function(label) {
  winston.loggers.add(label, {
    console: {
      level: 'debug',
      colorize: true,
      label: label
    }
  });
};

addLogger('Parsley.Task');
addLogger('Parsley.Action');
addLogger('Parsley.Connection');
addLogger('Parsley');

var logger = winston.loggers.get('Parsley.Task');
logger.log('debug', 'cooooooool: %d', 2);
