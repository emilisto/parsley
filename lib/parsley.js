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

  Task           : require('./parsley/task'),
  CommandQueue   : require('./parsley/commandqueue'),
  Chord          : require('./parsley/chord'),
  Command        : require('./parsley/command'),
  DeferredResult : require('./parsley/deferredresult'),
  Logging        : require('./parsley/logging'),
  common         : require('./parsley/common')

});

module.exports = Parsley;
