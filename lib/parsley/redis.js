var redis = require('redis')
  , config = require('./config')
;

// Singleton pattern

var normal = null,
    listener = null;

module.exports = {
  get: function() {
    if(!normal) normal = redis.createClient(config.redis);
    return normal;
  },
  getListener: function() {
    if(!listener) listener = redis.createClient(config.redis);
    return listener;
  }
};
