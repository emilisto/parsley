var  _ = require('underscore')
  , logging = require('./logging')
  , redis = require('./redis')
  , common = require('./common')
  , util = require('util')
  , key = common.redisKey
  , EventEmitter2 = require('eventemitter2').EventEmitter2
;

// Uses a messagequeue to do its jobs
// Use this object to get result from a task

var DeferredResult = function(commandId) {
  EventEmitter2.call(this);

  if(commandId && !_.isString(commandId)) {
    throw new Error('commandId must be a string');
  }

  var logger = logging.getLogger('Parsley.DeferredResult');
  logger.extend(this);
  this.commandId = commandId;

  this.listener = redis.getListener();
  this.redis = redis.get();
};

util.inherits(DeferredResult, EventEmitter2);

_.extend(DeferredResult.prototype, {

  key: function() {
    return key('result', this.commandId);
  },

  _finish: function() {
    this.log('debug', '_finish: %o', arguments);
  },
  _error: function() {
    this.log('debug', '_error: %o', arguments);
  },

  setResult: function(result) {
    this.result = result;
    this.emit('changed', result);
  },

  listen: function() {
    var self = this;
    var key = this.key();
    this.log('debug', 'listening on %s for results', key);
    this.listener.subscribe(key, function() {});
    this.listener.on('message', function(channel, result) {
      if(channel === key) self.setResult(result);
    });
  },

  get: function(cb) {
    if(this.result) return cb(null, result);

    this.listen();
    this.on('changed', _.partial(cb, null));
  },

  publish: function(result) {
    var key = this.key();
    this.log('info', 'publishing result to %s', key);
    this.redis.publish(key, result, function() { });
    this.setResult(result);
  }

});

DeferredResult.deserialize = function(command, result) {
  var result = new DeferredResult(command.id);
  result.setResult(result);
  return result;
};

module.exports = DeferredResult;
