var _ = require('underscore')
  , Parsley = require('..')
  , assert = require('chai').assert
;

Parsley.config.redis = { port: 16379 };
Parsley.Logging.config.transports = {
  console: { level: 'error' }
};

var worker;

// Dump example command for testing
var makeTripleCommand = function(i) {
  return new Parsley.Command(function(i) {
    return 3*i;
  }, i);
};

module.exports = {

  // FIXME: if we run the Parsley worker in the same process, the Redis pub/sub
  // doesn't seem to work.

  //before: function() { this.worker = new Parsley.Worker(); },
  //beforeEach: function() { this.worker.start(); },
  //afterEach: function() { this.worker.end(); },


  'Parsley Basics': {

    'any function can be made into a command and executed on a remote Parsley worker': function(done) {
      var toUpperCase = function(str) {
        return str.toUpperCase(); 
      };

      var str = 'Im some kind of result';
      new Parsley.Command(toUpperCase, str)
        .dispatch() 
        .get(function(err, result) {
          assert(!err, 'error should be null for a successful task');
          assert(result === toUpperCase(str), 'we should get the same result as when executing the function locally');
          done();
        });
    },

    'tasks can run and return values asynchronously': function(done) {

      var asyncIdentity = function(callback, str) {
        setTimeout(function() {
          callback(null, str);
        }, 30);
      };

      var str = 'this describes the purpose of this test, and is used in the test, neat isnt it?';
      new Parsley.Command(asyncIdentity, str)
        .dispatch() 
        .get(function(err, result) {
          assert(result === str, str);
          done();
        });
    },

    'raising exceptions in tasks will make it fail, including information about the error in the results': function(done) {

      var command = new Parsley.Command(function() {

        throw new Error('this is the message');

      }).dispatch().get(function(err, result) {
        assert(err, 'throwing an exception makes the task fail');
        assert.deepEqual(err, {
          'type': 'Error',
          'message': 'this is the message'
        }, 'exception type and message should be passed along');
        done();
      });

    },

    'the Parsley object is accessible and usable from within tasks': function(done) {
      new Parsley.Command(function simple(callback) {

        // Parsley is available in this.Parsley

        var command = new this.Parsley.Command(function() {
          // Note that this command is created and dispatched from a command itself.
          return 'Im the master of my worker.';
        }).dispatch().get(callback);

      }).dispatch().get(function(err, result) {
        assert(result === 'Im the master of my worker.');
        done();
      });
    }

  },

  'Parsley Canvas': {

    'Chain': function(done) {
      var commands = _(3).times(makeTripleCommand);
      new Parsley.Canvas.Chain(commands)
        .dispatch()
        .get(function(err, result) {
          assert(result === 6, 'chain only returns the result of the last command');
          done();
        });
    },

    'Chord': function(done) {
      var nTasks = 4;
      var commands = _(nTasks).times(makeTripleCommand);
      new Parsley.Canvas.Chord(commands)
        .dispatch()
        .get(function(err, result) {
          // FIXME: the result should really be 9 and not '9'
          assert(_.values(result).length === nTasks, 'chord returns the result from each command');
          done();
        });
    },

    'Group': function(done) {
      var commands = _(4).times(makeTripleCommand);

      new Parsley.Canvas.Group(commands)
        .dispatch()
        .get(function(err, result) {
          assert(!result, "group should not return anything - it's just dispatched into oblivion");
          done();
        });
    }
  }

};
