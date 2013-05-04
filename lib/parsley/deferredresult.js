var  _ = require('underscore')
  , logging = require('./logging')
  , redis = require('./redis')
  , common = require('./common')
  , util = require('util')
  , key = common.redisKey
  , EventEmitter2 = require('eventemitter2').EventEmitter2
;

var logger = logging.getLogger('Parsley.DeferredResult');


var channel = key('command', 'finish');

// Singleton pattern
// FIXME: this will lead to a memory leak. Make sure to destory old results.
var commandIdInstanceMap = {};

var listening = false;
var ensureListening = function() {

  if(listening) return;
  listening = true;

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
    if(command) command.setResult(data.result);
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

  setResult: function(result) {
    this.result = result;
    this.emit('changed', result);
  },

  get: function(cb) {
    if(this.result) return cb(null, result);
    this.on('changed', _.partial(cb, null));
  },

  publish: function(result) {
    var channel = this.channel();
    logger.log('info', 'publishing result to %s', channel);

    var data = JSON.stringify({
      result: result, id: this.commandId
    });
    this.redis.publish(channel, data, function() { });
    this.setResult(result);
  }

});

DeferredResult.deserialize = function(command, result) {
  var result = new DeferredResult(command.id);
  result.setResult(result);
  return result;
};

module.exports = DeferredResult;
