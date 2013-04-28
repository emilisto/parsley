var Parsley = require('..')
  , assert = require('chai').assert
;

// Disable logging
Parsley.Logging.config.transports = {
  console: { level: 'error' }
};

module.exports = {

  'running a function manually and as a task yields same result': function() {

    var sampleFn = function(val) { return val * 2; };
    var sampleTask = new Parsley.Task(sampleFn);

    assert.equal(
      sampleTask.run(123),
      sampleFn(123)
    );
  }

};
