var  _ = require('underscore')
  , Command = require('./command')
  , Task = require('./task')
  , LinkableMixin = require('./linkable')
  , common = require('./common')
  , key = common.redisKey
  , logging = require('./logging')
;

// Children can be functions, tasks, or arrays
var BaseChord = function(children) {

  _.bindAll(this, 'addCommand');

  // Make a chain of all tasks

  this.n_completed = 0;
  _.each(children || [], this.addCommand);

  var logger = logging.getLogger('Parsley.BaseChord');
  logger.extend(this);

};

_.extend(BaseChord.prototype, LinkableMixin, {

  addCommand: function(child) {
    var command = Command.make(child);
    command.chord = this;

    if(!this.commands) this.commands = [];
    this.commands.push(command);
    this.n_total = this.commands.length;
  },

  dispatch: function() {},

  serialize: function() {
    return _.extend({
      id: null,
      commands: this._serializeCommands(this.commands),
      n_total: this.n_total,
      n_completed: this.n_completed
    }, this._serializeCallbacks());
  },

  key: function() {
    return key('chord', this.id)
  },

  // Identical to the Command's save method
  save: function() {
    var key = this.key();

    var data = this.serialize();
    var redisData = _.reduce(data, function(total, field, value) {
      return total.concat([ value, JSON.stringify(field) ]);
    }, []);

    this._saveCallbacks();

    var args = [ key ].concat(redisData);
    this.redis.hmset(args, callback || function() {});

    this.log('debug', 'saved %s', key);

  },

  _finishCommand: function(id) {

  },
  _finish: function() {
    // Run when all tasks in the chord have been finished
  }

  // Collect arguments from all commands in the chord

});

BaseChord.deserialize = function(data) {
  var basechord = new BaseChord();

  basechord.id              = data.id;
  basechord.n_completed     = data.n_completed;
  basechord.n_total         = data.n_total;
  basechord.callbacks       = data.callbacks || [];
  basechord.error_callbacks = data.error_callbacks || [];
  basechord.commands        = data.commands || [];

  return basechord;
};

module.exports = {
  BaseChord: BaseChord,
  Group: null,
  Chain: null,
  Chord: null
};
