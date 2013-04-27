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

  Task          : require('./parsley/task'),
  Action        : require('./parsley/action'),
  DispatchQueue : require('./parsley/dispatchqueue'),
  Dispatch      : require('./parsley/dispatch'),
  Logging       : require('./parsley/logging')

});

module.exports = Parsley;
