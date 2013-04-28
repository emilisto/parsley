var Parsley = require('..')
  , assert = require('chai').assert
;

// Disable logging
Parsley.Logging.config.transports = {
  console: { level: 'error' }
};

module.exports = {

  'serializing and deserializing yields the same function': function() {
    var fn = function(val) { return val * 10 + 3; }

    var task = new Parsley.Task(fn);
    var serializedData = task.serialize();
    var deserializedTask = Parsley.Task.deserialize(serializedData);

    assert.equal(
      task.run(10),
      deserializedTask.run(10)
    );
  }

};
