
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
    },

    'ChordMap': function(done) {
      var multiplyByEight = function(i) {
        return i * 8;
      };

      var command = new Parsley.Canvas.Chain([
        function() { return [ 1, 2, 3]; },
        new Parsley.Canvas.ChordMap(multiplyByEight),
        function(result) {
          var unary = function(fn) {
            return function(arg) { return fn(arg); };
          };
          return _.map(result, unary(parseInt));
        }
      ]);

      command
        .dispatch()
        .get(function(err, result) {
          assert.deepEqual(result, [ 8, 16, 24 ]);
          done();
        });

    },

    'Failing chain': function(done) {
      var command = Parsley.Canvas.Chain([
        function() { return 'okay' },
        // Failing task
        function() {
          fsads();
        },
        function() {
          return 'okay task';
        }
      ]);

      command.dispatch().get(function(err, reslt) {
        console.log('got it');
        console.log(arguments);
      });
    }

  }

};
