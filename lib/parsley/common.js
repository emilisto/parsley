var  _ = require('underscore');

// This way we can change the redis instance
exports.redis = require('redis');

exports.assertParameters = function(options) {
  var parameters = Array.prototype.slice.call(arguments, 1);

  _.each(parameters, function(parameter) {
    if(!options.parameter) throw new Error('options.' + parameter + ' is required');
  });
};
var argumentsToArray = exports.argumentsToArray = function(args) { return Array.prototype.slice.call(args); };

var namespace = 'parsley';
exports.redisKey = function () {
  var args = Array.prototype.slice.apply(arguments)
  args.unshift (namespace)
  return args.join(":")
}

var proxyMethod = exports.proxyMethod = function(from, to, methodName) {
  var _method = from[methodName];
  from[methodName] = function() {
    var args = argumentsToArray(arguments);
    return _method.apply(to, args);
  };
};

var proxyMethods = exports.proxyMethods = function(from, to /* [ methodNames... ] */) {
  var methodNames = Array.prototype.slice.call(arguments, 2);
  _.each(methodNames, _.partial(proxyMethod, from, to));
}

exports.shortId = function(id) { return id.split('-')[0]; };
