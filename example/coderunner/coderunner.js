var Parsley = require('../..');

var argumentsToArray = function(args) { return Array.prototype.slice.call(args); };

var CodeRunner = function(options) {

  options = options || {};
  if(options.redisPort) Parsley.config.redis.port = options.redisPort;
  if(options.redisHost) Parsley.config.redis.host = options.redisHost;

};

var tasks = {
  installDependency: function(callback, dependency) {
    console.log('installing dependency: ');
    callback();
  },

  identifyDependencies: function(src) {
    return [ 'underscore', 'coollib' ];
  },

  run: function(callback, src, vm) {
    // Asynchronous result - a promise basically
    var result = new Parsley.DeferredResult();

    setTimeout(function() {
      result.resolve('i am the output');
    }, 1000)

    return result;
  }

};

CodeRunner.prototype.run = function(code, args) {

  var command = new tasks.identifyDependencies(code);

  var command = new Parsley.Canvas.Chain([
    new Command(tasks.identifyDependencies, src)
  ]);
  command.addArguments(args);
  return command.dispatch();

};

module.exports = CodeRunner;
