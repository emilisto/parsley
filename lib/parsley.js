/*
 * parsley - a distributed task queue for node.js
 *
 * (C) 2013 Emil Stenqvist
 * MIT license
 *
 */

var _ = require('underscore');

var Parsley = function() {
  // TODO: add easy connection here
};

_.extend(Parsley, {

  // TODO: add convenience methods here

  CommandQueue   : require('./parsley/commandqueue'),
  Task           : require('./parsley/task'),
  Command        : require('./parsley/command'),
  Chord          : require('./parsley/chord'),
  DeferredResult : require('./parsley/deferredresult'),
  Logging        : require('./parsley/logging'),
  config         : require('./parsley/config')

});

module.exports = Parsley;
