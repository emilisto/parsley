var Parsley = require('..')
  , assert = require('assert')
;

module.exports = {

  'running a function manually and as a task yields same result': function() {

    var sampleFn = function(val) { return val * 2; };
    var sampleTask = new Parsley.Task(sampleFn);

    assert.equal(
      new Parsley.Action(sampleTask, 123).run(),
      sampleFn(123)
    );
  },

  'arguments can be added to actions': function() {

    var args = null
    var sampleFn = function() {
      args = [].concat(arguments);
    };

    var sampleTask = new Parsley.Task(sampleFn);
    var action = new Parsley.Action(sampleTask, 'first');
    action.addArguments('second');
    action.run();

    assert(args.length === 2)
  }

};
