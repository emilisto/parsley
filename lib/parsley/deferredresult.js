var  _ = require('underscore')
  , logging = require('./logging')
  , redis = require('./redis')
  , common = require('./common')
  , util = require('util')
  , key = common.redisKey
  , EventEmitter2 = require('eventemitter2').EventEmitter2
;

var logger;
var channel = key('command', 'finish');

// Singleton pattern
// FIXME: this will lead to a memory leak. Make sure to destory old results.
var commandIdInstanceMap = {};

var listening = false;
var ensureListening = function() {

  if(listening) return;
  listening = true;

  if(!logger) logger = logging.getLogger('Parsley.DeferredResult'); 
  logger.log('debug', 'listening on %s for results', channel);

  var listener = redis.getListener();
  listener.subscribe(channel, function() {});
  listener.on('message', function(_channel, data) {
    if(channel !== _channel) return;

    data = JSON.parse(data);
    if(!data.id) {
      throw new Error('invalid data: ' + util.format(data));
    }

    var command = commandIdInstanceMap[data.id];
    if(command) {
      command.setResult(data.error, data.result);
    }
  });

};

var DeferredResult = function(commandId) {
  EventEmitter2.call(this);

  if(commandId && !_.isString(commandId)) {
    throw new Error('commandId must be a string');
  }

  this.commandId = commandId;

  this.redis = redis.get();
  ensureListening();

  if(commandId) {
    commandIdInstanceMap[commandId] = this;
  }
};

util.inherits(DeferredResult, EventEmitter2);

_.extend(DeferredResult.prototype, {

  channel: function() {
    return key('command', 'finish');
  },

  setResult: function(error, result) {
    this.result = result;
    this.error = error;
    this.emit('changed', error, result);
  },

  get: function(cb) {
    if(this.error || this.result) {
      return cb(this.error, this.result);
    } else {
      this.on('changed', cb);
    }
  },

  publish: function(error, result) {
    var channel = this.channel();
    logger.log('info', 'publishing result to %s', channel);

    var data = JSON.stringify({
      error: error,
      result: result,
      id: this.commandId
    });

    this.redis.publish(channel, data, function() { });
    this.setResult(error, result);
  }

});

DeferredResult.deserialize = function(command, result) {
  var result = new DeferredResult(command.id);
  result.setResult(result);
  return result;
};

module.exports = DeferredResult;
