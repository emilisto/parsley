var  _ = require('underscore')
  , logging = require('./logging')
  , common = require('./common')
  , amqp = require('amqp')
;

var MessageQueue = function(options) {
  options = _.defaults(options || {}, {
  });

  var logger = logging.getLogger('Parsley.Task');
  logger.extend(this);

  this.conn = amqp.createConnection(options);
};

_.extend(MessageQueue.prototype, {

});

module.exports = MessageQueue;
