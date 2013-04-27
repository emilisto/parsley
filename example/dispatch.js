var Parsley = require('..')

var sampleTask = new Parsley.Task(function test(val) {
  return val * 2;
});

var mq = new Parsley.MessageQueue({
  host: 'localhost',
  port: 16379
});

var action = new Parsley.Action(sampleTask, 12);
var dispatch = mq.dispatch(action);

mq.ready(function() {
  mq.end();
});

