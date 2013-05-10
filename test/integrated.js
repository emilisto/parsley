/*
 * Integrated tests
 *
 * These require a working redis server. Parsley is heavily written around
 * redis, and so testing it without a redis server would be difficult and more
 * importantly not give any real indiciation of whether it works or not. I
 * can't see us abstracting the redis parts away either, sincw we rely on
 * pieces of Lua being run in redis, which one could not mock without
 * implementing a complete Redis server.
 *
 * IMPORTANT: Currently, to run these tests you need a Parsley worker running,
 * see the FIXME right after module.exports.
 */

var _ = require('underscore')
  , Parsley = require('..')
  , assert = require('chai').assert
;

Parsley.config.redis = { port: 16379 };
Parsley.Logging.config.transports = {
  console: { level: 'error' }
};

// Dump example command for testing
var makeTripleCommand = function(i) {
  return new Parsley.Command(function(i) {
    return 3*i;
  }, i);
};

module.exports = {

  // FIXME: if we run the Parsley worker in the same process strange things happen.
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
    },

    'linking of tasks': function(done) {
      var command1 = new Parsley.Command(function(initial) { return initial + 123; }),
          command2 = new Parsley.Command(function(res) { return res + 5; }),
          command3 = new Parsley.Command(function(res) { return res + 10; });

      command1.link(command2);
      command2.link(command3);
      command1.dispatch(15);

      command3.get(function(err, result) {
        assert(result === (15 + 123 + 5 + 10), 'result is passed from each finished command to the next');
        done();
      });

    },

    'linking of commandset': function(done) {

      var commands = [
        new Parsley.Command(function(initial) { return initial + 10; }),
        new Parsley.Command(function(initial) { return initial + 15; })
      ];

      var commandset = new Parsley.CommandSet(commands);

      var resultCommand = new Parsley.Command(function(result) { return result; });
      commandset.link(resultCommand);
      commandset.save();
      _.invoke(commands, 'dispatch', 20);

      resultCommand.get(function(err, result) {
        result = _.map(result, parseInt);
        assert.deepEqual(result, [ 20 + 10, 20 + 15 ]);
        done();
      });

    }

  },

  'Parsley Canvas': {

    'Basic Chain': function(done) {
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
    },

    'Linked Chord': function(done) {
      var multiplyByEight = new Parsley.Command(function(i) {
        return i * 8;
      });

      var linked = new Command(function(result) {
        return result;
      });

      var command = new Parsley.Canvas.Chord([ multiplyByEight ])
      command.link(linked);
      command.dispatch(3);

      command.get(function(err, result) {
        assert(parseInt(_.values(result)[0]) === 3 * 8);
        done();
      });
    }
  }

};
