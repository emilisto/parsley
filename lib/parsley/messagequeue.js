var  _ = require('underscore')
  , redis = require('redis')
  , deferred = require('deferred')
  , logging = require('./logging')
  , common = require('./common')
  , Dispatch = require('./dispatch')

;

var namespace = 'parsley';
var key = function () {
  var args = Array.prototype.slice.apply(arguments)
  args.unshift (namespace)
  return args.join(":")
}

var MessageQueue = function(options) {
  _.bindAll(this, '_connected', 'ready', 'dispatch', 'pop', 'end');

  this.options = options = _.defaults(options || {}, {
    // Default parameters go here
    queueName: 'dispatches'
  });

  var logger = logging.getLogger('Parsley.MessageQueue');
  logger.extend(this);

  // FIXME: for debugging only
  //redis.debug_mode = true;
  this.redis = redis.createClient(options);
  this.redis.on('ready', this._connected);

  this._deferred = deferred();
};

_.extend(MessageQueue.prototype, {
  _connected: function() {
    this._deferred.resolve();
  },
  ready: function(fn) {
    this._deferred.promise.then(fn);
  },

  dispatch: function(action) {
    var dispatch = new Dispatch(action, this);
    var _key = key(this.options.queueName);

    var json = JSON.stringify(dispatch.serialize());
    this.redis.rpush(_key, json);
    this.log('debug', 'dispatched action %d with %s', action.id, _key);

    return dispatch;
  },

  waitForDispatch: function() {
  },

  pop: function(cb) {
    var _key = key(this.options.queueName);
    this.redis.lpop(_key, function(err, data) {

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
