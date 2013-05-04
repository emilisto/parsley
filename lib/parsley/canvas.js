var  _ = require('underscore')
  , Command = require('./command')
  , Task = require('./task')
  , logging = require('./logging')
;

// Children can be functions, tasks, or arrays
var BaseChord = function(children) {

  // Make a chain of all tasks

  var chord = this;
  this.commands = _.map(children, function(child) {
    var command = Command.make(task);
    command.chord = chord;
  });

  var logger = logging.getLogger('Parsley.BaseChord');
  logger.extend(this);

};

_.extend(BaseChord.prototype, {

  dispatch: function() {},
  link: function(obj) { },
  link_error: function(obj) { },

  serialize: function() {
    return {
      id: null,
      commands: null,
      n_total: null,
      n_completed: null,
      callbacks: null,
      error_callbacks: null
    };
  },

  save: function() {

  },

  _finishCommand: function(id) {

  },
  _finish: function() {
    // Run when all tasks in the chord have been finished
  }

  // Collect arguments from all commands in the chord

});

BaseChord.deserialize = function(data) {
};

module.exports = {
  BaseChord: BaseChord,
  Group: null,
  Chain: null,
  Chord: null
};
