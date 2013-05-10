var Parsley = require('../..');

var argumentsToArray = function(args) { return Array.prototype.slice.call(args); };

var CodeRunner = function(options) {

  options = options || {};
  if(options.redisPort) Parsley.config.redis.port = options.redisPort;
  if(options.redisHost) Parsley.config.redis.host = options.redisHost;

};

var tasks = {
  installDependency: function(callback, dependency) {

    console.log('INSTALLING dependency: ', dependency);

    setTimeout(function() {
      for(var i = 0; i < 10e7; i++);
      callback();
    }, 20);
  },

  identifyDependencies: function(src) {
    console.log('Identifying dependencies...');
    return [
      'underscore', 'coollib', 'winston', 'prettyprint', 'http', 'socketio',
      'backbone', 'amazon-aws', 'parsley', 'node_redis'
    ];
  },

  run: function(callback, src) {
    console.log(arguments);
    // Asynchronous result - a promise basically

    setTimeout(function() {
      callback(null, "I am the code generated.");
    }, 0);
  }

};

CodeRunner.prototype.run = function(code, args) {

  var command = new Parsley.Canvas.Chain([
    new Parsley.Command(tasks.identifyDependencies, code),
    new Parsley.Canvas.ChordMap(tasks.installDependency),
    new Parsley.Command(tasks.run, code, args)
  ]);

  var result = command.dispatch();
  result.get(Parsley.end);
  return result;
};

module.exports = CodeRunner;
