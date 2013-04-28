var  _ = require('underscore');

// This way we can change the redis instance
exports.redis = require('redis');

exports.assertParameters = function(options) {
  var parameters = Array.prototype.slice.call(arguments, 1);

  _.each(parameters, function(parameter) {
    if(!options.parameter) throw new Error('options.' + parameter + ' is required');
  });
};
exports.argumentsToArray = function(args) { return Array.prototype.slice.call(args); };

var namespace = 'parsley';
exports.redisKey = function () {
  var args = Array.prototype.slice.apply(arguments)
  args.unshift (namespace)
  return args.join(":")
}
