var  _ = require('underscore')
  , util = require('util')
  , Command = require('./command').Command
  , CommandSet = require('./command').CommandSet
  , logging = require('./logging')
;

var Group = function(commands) {

  Command.call(this, function(results) {
    return results;
  });

  this.commands = commands;
  var commandset = this.commandset = new CommandSet(commands);
  commandset.link(this);
  commandset.save();
};

util.inherits(Group, Command);

_.extend(Group.prototype, {
  dispatch: function() {
    _.invoke(this.commands, 'dispatch');
    return this;
  }
});

module.exports = {
  Group: Group,
  Chain: null,
  Chord: null
};
