var  _ = require('underscore')
  , util = require('util')
  , common = require('./common')
  , Command = require('./command').Command
  , CommandSet = require('./command').CommandSet
  , argumentsToArray = require('./common').argumentsToArray
  , logging = require('./logging')
;

// "identity tasks" - they return what they're given. Used as "proxy tasks" for the
// different canvas commands implemented below.
var identity = function(result) {
  return result;
};

var makeIdentity = function(name) {
  var fn = function(result) { return result; };
  fn.name = name;
  return fn;
};

// I'm not sure what I think of these methods - they DRY things up, but they
// make the code harder to understand. ESPECIALLY note how we don't return the
// return value of the proxied method call, but the from object, so that we get
// continuation-passing style API.
var proxyContinuationMethod = function(from, to, methodName) {
  var _method = from[methodName];
  from[methodName] = function() {
    var args = argumentsToArray(arguments);
    _method.apply(to, args);
    return from;
  };
};
var proxyContinuationMethods = function(from, to /* [ methodNames... ] */) {
  var methodNames = Array.prototype.slice.call(arguments, 2);
  _.each(methodNames, _.partial(proxyContinuationMethod, from, to));
}

//
// Group command
//
var Group = function(commands) {
  Command.call(this, identity);
  this.commands = commands;
};
util.inherits(Group, Command);
_.extend(Group.prototype, {
  dispatch: function() {
    _.invoke(this.commands, 'dispatch');
    Command.prototype.dispatch.call(this);
    return this;
  }
});

//
// Chain command
//
var Chain = function(commands) {
  _.bindAll(this, 'addCommand');

  Command.call(this, makeIdentity('Chain'));
  this.commands = [];
  _.each(commands, this.addCommand);
};
util.inherits(Chain, Command);

_.extend(Chain.prototype, {

  addCommand: function(command) {
    command = Command.make(command);
    if(this.commands && this.commands.length) {
      _.last(this.commands).link(command);
    }
    this.commands.push(command);
    return this;
  },
  dispatch: function() {
    this.addCommand(this);
    this.commands[0].dispatch();
    return this;
  }

});

//
// Chord command
//
var Chord = function(commands) {
  _.bindAll(this, '_onDispatch');

  Command.call(this, this._dispatchChord);

  this.commands = commands;
  var commandset = this.chordCommandSet = new CommandSet(commands);

  this.resulting = new Command(makeIdentity('Chord'));
  commandset.link(this.resulting);
  commandset.save();

  proxyContinuationMethods(this, this.resulting, 'link', 'get');

  this.on('dispatch', this._onDispatch);
};
util.inherits(Chord, Command);
_.extend(Chord.prototype, {

  serializationMap: _.extend(Command.prototype.serializationMap, {
    "commands": "commands",
    'chordCommandSet': {
      'serialize': function(commandset) {
        return commandset.id ? commandset.id : commandset;
      },
      'deserialize': function(val) { return val; }
    }
  }),

  _onDispatch: function() {
    _.each(this.commands, function(command) {
      command.save();
    });
    this.resulting.save();
  },

  _dispatchChord: function _dispatchChord(result) {
    var _ = require('underscore');
    var Command = this.Parsley.Command;

    _.each(this.commands, function(id) {
      Command.dispatchIdWithArgs(id, [ result ]);
    });

  }
});

//
// ChordMap command
//
var ChordMap = function(command) {
  Command.call(this, this.chordmapTask);
  this.chordmapCommand = command;

  this.resulting = new Command(function(result) {
    var _ = require('underscore');
    return _.values(result);
  });

  proxyContinuationMethods(this, this.resulting, 'link', 'get');
};
util.inherits(ChordMap, Command);
_.extend(ChordMap.prototype, {

  serializationMap: _.extend(Command.prototype.serializationMap, {
    'chordmapCommand' : 'command',
    'resulting'       : 'command'
  }),

  save: function() {
    this.chordmapCommand.save();
    this.resulting.save();
    return Command.prototype.save.call(this);
  },

  chordmapTask: function chordmapTask(items) {
    var Command = this.Parsley.Command,
        Chord = this.Parsley.Canvas.Chord,
        self = this;

    var command = new Command();
    command.fetch(this.chordmapCommand, function(err, command) {

      var commands = _.map(items, function(item) {
        return command.clone().addArguments([ item ]);
      });

      var chord = new Chord(commands);
      chord.link(self.resulting);
      chord.save();
      chord.dispatch();

    });
  }

});

module.exports = {
  Group    : Group,
  Chain    : Chain,
  Chord    : Chord,
  ChordMap : ChordMap
};

