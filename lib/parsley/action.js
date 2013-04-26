var getLogger = require('./logging').getLogger
  , _ = require('underscore')
;

var Action = function() {
  this.logger = makeLogger(this.constructor.name);
};

module.exports = Action;

