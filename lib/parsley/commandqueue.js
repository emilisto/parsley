var  _ = require('underscore')
  , util = require('util')
  , deferred = require('deferred')
  , logging = require('./logging')
  , common = require('./common')
  , redis = require('./redis')
  , Command = require('./command')
  , EventEmitter2 = require('eventemitter2').EventEmitter2
;

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
  });

  var logger = logging.getLogger('Parsley.CommandQueue');
  logger.extend(this);

  this.key = _.partial(common.redisKey, 'command');

  this.redis = redis.get();

  proxyEvents(this.redis, this, 'ready');
};

util.inherits(CommandQueue, EventEmitter2);

_.extend(CommandQueue.prototype, {

  enqueue: function(command, cb) {
    var json, id;

    id = command.id;
    json = JSON.stringify(command.serialize());

    // Here: make the Command save itself instead

    this.redis.multi()
      .rpush(this.key('queue'), id)
      .set(this.key(id), json)
      .publish(this.key('queue'), id)
      .exec(function(err) {
        if(cb) cb(err, command);
      })

    this.log('debug', 'enqueued command %s to %s', id, this.key('queue'));

    return command;
  },

  // Dequeue a specific item
  dequeue: function(id, cb) {
    var self = this;
    this.redis.get(this.key(id), function(err, data) {

      if(err || !data) {
        if(!err) err = new Error('no such id');
        cb(err);
        return;
      }

      self.redis.lrem(self.key('queue'), 0, id)
      self.log('debug', 'removed %s from command queue', id);

      var command = self._deserialize(data);
      cb(err, command);
    });
  },

  // Dequeue oldest last item on the queue, if there's one
  pop: function(cb) {
    var self = this;
    this.redis.lpop(this.key('queue'), function(err, id) {
      if(err || !id) {
        cb(err, id);
      } else {
        self.redis.get(self.key(id), function(err, data) {
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
    var listener = this.listener = redis.getListener();
    listener.subscribe(this.key('new'));

    this.log('debug', 'listening on %s', this.key('new'));

    listener.on('message', function(channel, id) {
      self.emit('command', id);
    });
  },

  _deserialize: function(data) {
    var serializedCommand = JSON.parse(data);
    var command = Command.deserialize(serializedCommand);
    command.queue = this;
    return command;
  },

  end: function() {
    this.redis.end();
  }
});

module.exports = CommandQueue;

