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

_.extend(Parsley.prototype, {

  // TODO: add convenience methods here

  Task       : require('./parsley/task'),
  Action     : require('./parsley/action'),
  Connection : require('./parsley/connection'),
  Messaging  : require('./parsley/messaging')
});

module.exports = Parsley;
