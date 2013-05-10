function(arg) {
  var _ = require('underscore');
  var util = require('util');
  return [ "this-is-so-cool", _.uniqueId(), arg * 3].join('-');
};
