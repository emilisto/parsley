/*
 * parsley - a distributed task queue for node.js
 *
 * (C) 2013 Emil Stenqvist
 * MIT license
 *
 */

var _ = require('underscore');
    CommandQueue  = require('./parsley/commandqueue'),
    Task = require('./parsley/task'),
    Command = require('./parsley/command').Command,
    CommandSet = require('./parsley/command').CommandSet,
    Canvas = require('./parsley/canvas'),
    DeferredResult = require('./parsley/deferredresult'),
    Logging = require('./parsley/logging'),
    redis = require('./parsley/redis'),
    config = require('./parsley/config')
;


// TODO: make it possible to create instance of this, but by default, return an
// instance that can be used. Make the particular instance be passed into Task,
// CommandQueue, etc.

var Parsley = function() {
  // TODO: add easy connection here
};

_.extend(Parsley, {

  // TODO: add convenience methods here

  CommandQueue   : CommandQueue,
  Task           : Task,
  Command        : Command,
  CommandSet     : CommandSet,
  Canvas         : Canvas,
  DeferredResult : DeferredResult,
  Logging        : Logging,
  config         : config,

  end: function() {
    redis.get().end();
    redis.getListener().end();
  }

});

module.exports = Parsley;
