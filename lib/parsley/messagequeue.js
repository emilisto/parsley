var  _ = require('underscore')
  , redis = require('redis')
  , util = require('util')
  , deferred = require('deferred')
  , logging = require('./logging')
  , common = require('./common')
  , Dispatch = require('./dispatch')
  , EventEmitter2 = require('eventemitter2').EventEmitter2
;

var namespace = 'parsley';
var key = function () {
  var args = Array.prototype.slice.apply(arguments)
  args.unshift (namespace)
  return args.join(":")
}

var proxyEvents = function(from, to) {
  var args = Array.prototype.slice.call(arguments, 2);
  _.each(args, function(ev) {
    from.on(ev, function() {
      var args = [ ev ].concat(Array.prototype.slice.call(arguments));
      to.emit.apply(to, args);
    });
  });
};

var MessageQueue = function(options) {

  EventEmitter2.call(this, {
    // EventEmitter2 options go here
  });

  _.bindAll(this, 'dispatch', 'pop', 'end');

  this.options = options = _.defaults(options || {}, {
    // Default parameters go here
    queueName: 'dispatches'
  });


  var logger = logging.getLogger('Parsley.MessageQueue');
  logger.extend(this);

  this.key = key(this.options.queueName);
  this.log('debug', 'listening on %s', key);

  // FIXME: for debugging only
  //redis.debug_mode = true;

  this.redis = redis.createClient(options);

  proxyEvents(this.redis, this, 'ready');
};

util.inherits(MessageQueue, EventEmitter2);

_.extend(MessageQueue.prototype, {
  dispatch: function(action) {
    var dispatch = new Dispatch(action, this);

    var json = JSON.stringify(dispatch.serialize());
    this.redis.rpush(this.key, json);
    this.redis.publish(this.key, 'new-dispatch');
    this.log('debug', 'dispatched action %d with %s', action.id, this.key);

    return dispatch;
  },

  listen: function(fn) {
    var self = this;

    var listener = this.listener = redis.createClient(this.options);
    listener.subscribe(this.key);
    listener.on('message', function(channel, message) {
      console.log('message!');
      self.emit('message', message);
      fn(message);
    });
  },

  pop: function(cb) {
    this.redis.lpop(this.key, function(err, data) {

      if(err || !data) {
        cb(err, data);
        return
      }

      var serializedDispatch = JSON.parse(data);
      var dispatch = Dispatch.deserialize(serializedDispatch);
      dispatch.mq = this;

      cb(null, dispatch);
    });
  },

  end: function() {
    this.redis.end();
  }
});

module.exports = MessageQueue;
