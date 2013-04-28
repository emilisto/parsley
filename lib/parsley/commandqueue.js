var  _ = require('underscore')
  , util = require('util')
  , deferred = require('deferred')
  , logging = require('./logging')
  , common = require('./common')
  , Command = require('./command')
  , EventEmitter2 = require('eventemitter2').EventEmitter2
;

var key = common.redisKey;

var proxyEvents = function(from, to) {
  var args = Array.prototype.slice.call(arguments, 2);
  _.each(args, function(ev) {
    from.on(ev, function() {
      var args = [ ev ].concat(Array.prototype.slice.call(arguments));
      to.emit.apply(to, args);
    });
  });
};

var CommandQueue = function(options) {

  EventEmitter2.call(this, {
    // EventEmitter2 options go here
  });

  _.bindAll(this, 'enqueue', 'dequeue', 'end');

  this.options = options = _.defaults(options || {}, {
    // Default parameters go here
    queueName: 'dispatches'
  });

  var logger = logging.getLogger('Parsley.CommandQueue');
  logger.extend(this);

  this.key = key(this.options.queueName);
  this.log('debug', 'listening on %s', key);

  // FIXME: for debugging only
  //redis.debug_mode = true;

  this.redis = common.redis.createClient(options);

  proxyEvents(this.redis, this, 'ready');
};

util.inherits(CommandQueue, EventEmitter2);

_.extend(CommandQueue.prototype, {

  enqueue: function(action, cb) {
    var command = new Command(action, this),
        json = JSON.stringify(command.serialize()),
        id = command.id;

    this.redis.multi()
      .rpush(this.dispatchesKey, id)
      .set(id, json)
      .publish(this.dispatchesKey, json)
      .exec(function(err) {
        if(cb) cb(err, command);
      })

    this.log('debug', 'enqueued command %s to %s', id, this.dispatchesKey);

    return command;
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
      self.log('debug', 'removed %s from command queue', id);

      var command = self._deserialize(data);
      cb(err, command);
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

          var command = self._deserialize(data);
          cb(null, command);
        });
      }
    });
  },

  // Start subscribing for command events
  listen: function() {
    var self = this;
    var listener = this.listener = common.redis.createClient(this.options);
    listener.subscribe(this.key);
    listener.on('message', function(channel, id) {
      self.emit('command', id);
    });
  },

  _deserialize: function(data) {
    var serializedCommand = JSON.parse(data);
    var command = Command.deserialize(serializedCommand);
    command.mq = this;
    return command;
  },

  end: function() {
    this.redis.end();
  }
});

module.exports = CommandQueue;

