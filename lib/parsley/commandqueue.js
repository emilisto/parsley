var  _ = require('underscore')
  , util = require('util')
  , deferred = require('deferred')
  , logging = require('./logging')
  , common = require('./common')
  , redis = require('./redis')
  , Command = require('./command')
  , DeferredResult = require('./deferredresult')
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
    var self = this;
    var id;

    id = command.id;

    // Here: make the Command save itself instead

    command.save(function(err) {
      console.log('it was saved');

      if(err) return cb(err);

      self.redis.multi()
        .rpush(self.key('queue'), id)
        .publish(self.key('new'), id)
        .exec(function(err) {
          if(cb) cb(err, command);
        })

      self.log('debug', 'enqueued command %s to %s', id, self.key('queue'));
    });

    return new DeferredResult(command.id);
  },

  // Dequeue a specific item
  dequeue: function(id, cb) {
    var self = this;

    self.redis.lrem(self.key('queue'), 0, id, function(err, removed) {
      if(err) return cb(err);

      if(!removed) {
        self.log('debug', 'dequeue: %s not in queue', id);
        return cb();
      }

      self.log('debug', 'dequeue: removed %s from commandqueue', id);
      Command.fetch(id, cb);
    });
  },

  // Dequeue oldest last item on the queue, if there's one
  pop: function(cb) {
    var self = this;
    this.redis.lpop(this.key('queue'), function(err, id) {
      if(err || !id) return cb(err, id);
      Command.fetch(id, cb);
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

