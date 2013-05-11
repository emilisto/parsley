function(arg) {
  var _ = require('underscore');
  var util = require('util');

  var n = Math.random() * 1000 | 0;
  return [ "I am a program, that Katie likes.", n ].join(' ');
};
