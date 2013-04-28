var  _ = require('underscore')
  , logging = require('./logging')
;

// Uses a messagequeue to do its jobs
// Use this object to get result from a task

var DeferredResult = function(command) {
  var logger = logging.getLogger('Parsley.DeferredResult');
  logger.extend(this);
};

_.extend(DeferredResult.prototype, {

  serialize: function() {
    return {};
  }

});

DeferredResult.deserialize = function(data) {
  return new DeferredResult();
};

module.exports = DeferredResult;
