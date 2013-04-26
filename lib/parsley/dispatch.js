var  _ = require('underscore')
  , logging = require('./logging')
  , uuid = require('uuid');
;

var Dispatch = function(action, conn) {
  var logger = logging.getLogger('Parsley.Task');
  logger.extend(this);

  if(!action) throw new Error('action required');
  if(!conn) throw new Error('conn required');
};

_.extend(Dispatch.prototype, {

});
