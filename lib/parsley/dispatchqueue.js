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

var DispatchQueue = function(options) {

  EventEmitter2.call(this, {
    // EventEmitter2 options go here
  });

  _.bindAll(this, 'enqueue', 'dequeue', 'end');

  this.options = options = _.defaults(options || {}, {
    // Default parameters go here
    queueName: 'dispatches'
  });


  var logger = logging.getLogger('Parsley.DispatchQueue');
  logger.extend(this);

  this.dispatchesKey = key(this.options.queueName);
  this.log('debug', 'listening on %s', key);

  // FIXME: for debugging only
  //redis.debug_mode = true;

  this.redis = redis.createClient(options);

  proxyEvents(this.redis, this, 'ready');
};

util.inherits(DispatchQueue, EventEmitter2);

_.extend(DispatchQueue.prototype, {

  enqueue: function(action, cb) {
    var dispatch = new Dispatch(action, this),
        json = JSON.stringify(dispatch.serialize()),
        id = dispatch.id;

    this.redis.multi()
      .rpush(this.dispatchesKey, id)
      .set(id, json)
      .publish(this.dispatchesKey, json)
      .exec(function(err) {
        if(cb) cb(err, dispatch);
      })

    this.log('debug', 'enqueued dispatch %s to %s', id, this.dispatchesKey);

    return dispatch;
  },

  // Dequeue a specific item
  dequeue: function(id, cb) {
    var self = this;
    this.redis.get(id, function(err, data) {

      if(err || !data) {
        if(!err) err = new Error('no such id');
        cb(err);
        return;
      }

      self.redis.lrem(self.dispatchesKey, 0, id)
      self.log('debug', 'removed %s from dispatch queue', id);

      var dispatch = self._deserialize(data);
      cb(err, dispatch);
    });
  },

  // Dequeue oldest last item on the queue, if there's one
  pop: function(cb) {
    var self = this;
    this.redis.lpop(this.dispatchesKey, function(err, id) {
      if(err || !id) {
        cb(err, id);
      } else {
        self.redis.get(id, function(err, data) {
          if(err) {
            cb(err); return;
          }

          var dispatch = self._deserialize(data);
          cb(null, dispatch);
        });
      }
    });
  },

  // Start subscribing for dispatch events
  listen: function() {
    var self = this;
    var listener = this.listener = redis.createClient(this.options);
    listener.subscribe(this.key);
    listener.on('message', function(channel, id) {
      self.emit('dispatch', id);
    });
  },

  _deserialize: function(data) {
    var serializedDispatch = JSON.parse(data);
    var dispatch = Dispatch.deserialize(serializedDispatch);
    dispatch.mq = this;
    return dispatch;
  },

  end: function() {
    this.redis.end();
  }
});

module.exports = DispatchQueue;
