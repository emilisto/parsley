var  _ = require('underscore')
  , logging = require('./logging')
;

// Uses a messagequeue to do its jobs
// Use this object to get result from a task

var Chord = function(command) {
  var logger = logging.getLogger('Parsley.Chord');
  logger.extend(this);
};

_.extend(Chord.prototype, {

  serialize: function() {
    return {};
  }

});

Chord.deserialize = function(data) {
  return new Chord();
};

module.exports = Chord;
