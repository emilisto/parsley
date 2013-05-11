var Parsley = require('parsley');

var argumentsToArray = function(args) { return Array.prototype.slice.call(args); };

var CodeRunner = function(options) {

  options = options || {};
  if(options.redisPort) Parsley.config.redis.port = options.redisPort;
  if(options.redisHost) Parsley.config.redis.host = options.redisHost;

};

var tasks = {
  installDependency: function(callback, dependency) {

    console.log('INSTALLING dependency: ', dependency);
    callback();
  },

  identifyDependencies: function(src) {
    return [
      'underscore', 'coollib', 'winston'
    ];
  },

  run: function(callback, src, args, dependencies) {

    var command = new this.Parsley.Command(src);
    command.addArguments(args);
    command.dispatch().get(function(err, result) {
      if(err) return callback(err);
      callback(null, result);
    });

  }

};

CodeRunner.prototype.run = function(code, args) {

  var command = new Parsley.Canvas.Chain([
    new Parsley.Command(tasks.identifyDependencies, code),
    new Parsley.Canvas.ChordMap(tasks.installDependency),

    // TODO: add a middlelayer here that goes through dependencies and sees if any were troublesome

    new Parsley.Command(tasks.run, code, args)
  ]);

  var result = command.dispatch();
  result.get(Parsley.end);
  return result;
};

module.exports = CodeRunner;
