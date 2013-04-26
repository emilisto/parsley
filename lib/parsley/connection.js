var getLogger = require('./logging').getLogger
  , _ = require('underscore')
;

var Connection = function() {
  this.logger = makeLogger(this.constructor.name);
};

module.exports = Connection;
