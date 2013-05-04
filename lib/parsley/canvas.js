var  _ = require('underscore')
  , util = require('util')
  , Command = require('./command').Command
  , CommandSet = require('./command').CommandSet
  , logging = require('./logging')
;

var identity = function(result) {
  return result;
};

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

  Command.call(this, identity);
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
  Command.call(this, identity);
  this.commands = commands;
  var commandset = this.commandset = new CommandSet(commands);
  commandset.link(this);
  commandset.save();
};
util.inherits(Chord, Command);
_.extend(Chord.prototype, {
  dispatch: function() {
    _.invoke(this.commands, 'dispatch');
    return this;
  }
});



module.exports = {
  Group: Group,
  Chain: Chain,
  Chord: Chord
};
