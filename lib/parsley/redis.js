var redis = require('redis')
  , config = require('./config')
;

// Singleton pattern

var normal = null,
    listener = null;

// FIXME: for debugging only
//redis.debug_mode = true;

var get = function() {
  if(!normal) normal = redis.createClient(config.redis);
  return normal;
};
var getListener = function() {
  if(!listener) listener = redis.createClient(config.redis);
  return listener;
};


var registeredScripts = {};

var registerScript = function(name, src) {
  get().script('load', src, function(err, sha) {});
  registeredScripts[name] = src;
};

var runScript = function(name) {
  var src = registeredScripts[name];
  if(!src) throw new Error('no script named ' + name);

  var redis = get();
  var args = [ src ].concat(Array.prototype.slice.call(arguments, 1));
  redis.eval.apply(redis, args);
};

// Taken from node_redis source
var replyToObject = function(reply) {
  var obj = {}, j, jl, key, val;

  if (reply.length === 0) return;

  for (j = 0, jl = reply.length; j < jl; j += 2) {
    key = reply[j].toString();
    val = reply[j + 1];
    obj[key] = val;
  }

  return obj;
};

module.exports = {
  get            : get,
  getListener    : getListener,
  registerScript : registerScript,
  runScript      : runScript,
  replyToObject  : replyToObject
};
