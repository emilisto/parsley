var  _ = require('underscore')
  , uuid = require('uuid')
  , logging = require('./logging')
  , common = require('./common')
  , Action = require('./action')
;

// Uses a messagequeue to do its jobs
// Use this object to get result from a task

var Dispatch = function(action, mq) {
  var logger = logging.getLogger('Parsley.Dispatch');
  logger.extend(this);

  if(!action) throw new Error('action required');

  this.action = action;
  this.mq = mq;

  this.id = uuid.v4().toString();
};

_.extend(Dispatch.prototype, {

  serialize: function() {
    return {
      id: this.id,
      action: this.action.serialize()
    }
  }

});

Dispatch.deserialize = function(data) {
  var action = Action.deserialize(data.action);
  var dispatch = new Dispatch(action);
  dispatch.id = data.id;
  return dispatch;
};

module.exports = Dispatch;
