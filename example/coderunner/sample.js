function() {
  var _ = require('underscore');
  var ret = Array.prototype.slice.call(arguments)
  ret.push(_.uniqueId());
  return ret;
};
