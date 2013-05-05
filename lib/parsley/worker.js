var _ = require('underscore')
  , CommandQueue = require('./commandqueue')
  , logging = require('./logging')
;

var Worker = function(options) {

  _.bindAll(this, 'handle', '_checkQueue', '_finish', '_execute');

  var logger = logging.getLogger('Parsley.Worker');
  logger.extend(this);

  this.options = _.defaults(options || {}, this.options);

  this.mq = new CommandQueue();

  this._active = 0;
  this._limit = 2;

  this._running = [];

};

_.extend(Worker.prototype, {

  options: {
    pollInterval: 500,
    concurrencyLimit: 2,
  },

  start: function() {
    this.mq.listen();
    this.mq.on('command', this.handle);
    this._interval = setInterval(this._checkQueue, this.options.pollInterval);
  },
  end: function() {
    this.log('info', 'stopping worker');

    clearInterval(this._interval);
    this._interval = null;

    this.mq.end();
  },

  nRunning: function() { return this._running.length; },
  isBusy: function() { return this.nRunning() >= this.options.concurrencyLimit; },

  handle: function(id) {
    if(this.isBusy()) return;
    this._execute(id);
  },

  _checkQueue: function() {
    if(this.isBusy()) return;

    this.mq.peek(function(err, id) {
      if(!id) return;
      this.log('debug', 'found command %s in queue', id);
      this.handle(id);
    }.bind(this));
  },

  _execute: function(id) {

    var removeFromQueue = function(id) {
      this._running = _.without(this._running, id);
    }.bind(this);

    this._running.push(id);

    this.mq.dequeue(id, function(err, command) {
      if(command) {

        this.log('info', 'executing command %s, currently running: %d/%d',
                 command.id, this.nRunning(), this.options.concurrencyLimit)

        command.on('finished', _.bind(removeFromQueue, this, id));
        command.run();
      } else {
        removeFromQueue(id);
      }
    }.bind(this));


  },

  _finish: function(command) {
    this._running = _.without(this._running, command.id);
    this.log('info', 'command %s finished, currently running: %d/%d',
             command.id, this.nRunning(), this.options.concurrencyLimit)
  }

});

module.exports = Worker;
