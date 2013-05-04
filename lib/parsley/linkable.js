var  _ = require('underscore')

var LinkableMixin = {
  _link: function(obj, which) {
    var Command = require('./command');

    if(!this[which]) this[which] = [];
    var command = Command.make(obj);
    this[which].push(command);
  },
  link: function(obj) {
    this._link(obj, 'callbacks');
    return this;
  },
  link_error: function(obj) {
    this._link(obj, 'error_callbacks');
    return this;
  },

  _dispatchCallbacks: function(ret) {
    var Command = require('./command');
    var self = this;

    var dispatchCallback = function(args, id) {
      Command.fetch(id, function(err, command) {
        command.addArguments(args);
        command.save();
        self.log('debug', 'dispatching callback command %s', command.id);
        command.dispatch();
      });
    };

    if(this.callbacks.length > 0) {
      this.log('debug', 'invoking %d callback(s)', this.callbacks.length);
    }
    if(this.error_callbacks.length > 0) {
      this.log('debug', 'invoking %d error_callback(s)', this.error_callbacks.length);
    }

    var args = [ ret ];
    _.each(this.callbacks || [], _.partial(dispatchCallback, args));
    _.each(this.error_callbacks || [], _.partial(dispatchCallback, args));

  },

  _saveCallbacks: function() {

    // FIXME: this is asynchronous, and there's a risk the task could finish
    // before the callbacks are saved. Make some kind of global buffer - or a
    // reference to .multi() that all methods use.

    var saveCallback = function(callback) {
      if(callback.save) callback.save();
    };
    _.each(this.callbacks || [], saveCallback);
    _.each(this.error_callbacks || [], saveCallback);
  },

  _serializeCallbacks: function(obj) {

    var serialize = function(obj) {
      return _.map(obj || [], function(val) {
        return val.id ?  val.id : val;
      });
    };

    return {
      callbacks       : serialize(this.callbacks),
      error_callbacks : serialize(this.error_callbacks),
    };
  }
};

module.exports = LinkableMixin;
