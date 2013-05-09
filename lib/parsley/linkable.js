var  _ = require('underscore')

var LinkableMixin = {
  _link: function(obj, which) {
    var Command = require('./command').Command;

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

  _dispatchCallbacksCommon: function(which, ret) {

    var Command = require('./command').Command;
    var self = this;

    var dispatchCallback = function(args, id) {
      // FIXME: replace arguments with a separate LIST key
      Command.fetch(id, function(err, command) {
        command.addArguments(args);
        command.save();
        self.log('debug', 'dispatching callback command %s', command.id);
        command.dispatch();
      });
    };

    var callbacks = this[which] || [];
    if(this.callbacks.length > 0) {
      this.log('debug', 'invoking %d %s', callbacks.length, which);
    }
    var args = [ ret ];
    _.each(callbacks, _.partial(dispatchCallback, args));

  },

  _dispatchErrorCallbacks: function(ret) {
    return this._dispatchCallbacksCommon('callbacks_error', ret);
  },
  _dispatchCallbacks: function(ret) {
    return this._dispatchCallbacksCommon('callbacks', ret);
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

  _serializeCommands: function(arr) {
    return _.map(arr || [], function(val) {
      return val.id ?  val.id : val;
    });
  },
  _serializeCallbacks: function(obj) {

    return {
      callbacks       : JSON.stringify(this._serializeCommands(this.callbacks)),
      error_callbacks : JSON.stringify(this._serializeCommands(this.error_callbacks)),
    };
  }
};

module.exports = LinkableMixin;
