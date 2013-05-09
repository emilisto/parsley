var  _ = require('underscore')
  , util = require('util')
  , deferred = require('deferred')
  , logging = require('./logging')
  , common = require('./common')
  , redis = require('./redis')
  , Command = require('./command').Command
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

  enqueueId: function(id, cb) {
    var self = this;

    self.redis.multi()
      .rpush(self.key('queue'), id)
      .publish(self.key('new'), id)
      .exec(function(err) {
        if(cb) cb(err, command);
      })

    self.log('debug', 'enqueued command %s to %s', id, self.key('queue'));

    return new DeferredResult(id);
  },
  enqueue: function(command, cb) {
    var self = this, id = command.id;

    command.save(function(err) {
      if(err) return cb(err);
      self.enqueueId(id, cb);
    });

    return new DeferredResult(id);
  },

  // Dequeue a specific item
  dequeue: function(id, cb) {
    var self = this;

    self.redis.lrem(self.key('queue'), 0, id, function(err, removed) {
      if(err) return cb(err);
      if(!removed) return cb();

      self.log('debug', 'dequeue: removed %s from commandqueue', id);

      var command = new Command();
      command.commandqueue = self;
      command.fetch(id, cb);
    });
  },

  // Dequeue oldest last item on the queue, if there's one
  pop: function(cb) {
    var self = this;
    this.redis.lpop(this.key('queue'), function(err, id) {
      if(err || !id) return cb(err, id);

      var command = new Command();
      command.fetch(id, cb);
    });
  },

  // Returns the next item in the work queue, if there's one
  peek: function(cb) {
    var self = this;
    this.redis.lindex(this.key('queue'), 0, function(err, id) {
      if(err) self.log('error', 'couldnt read the command queue: %s', err);
      cb(err, id);
    });
  },

  // Start subscribing for command events
  listen: function() {
    var self = this;
    var channel = this.key('new');
    var listener = this.listener = redis.getListener();
    listener.subscribe(channel);

    this.log('debug', 'listening on %s', channel);

    listener.on('message', function(_channel, id) {
      if(channel === _channel) self.emit('command', id);
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

