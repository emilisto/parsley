var Parsley = require('..')

var sampleTask = new Parsley.Task(function test(val, second) {
  var _ = require('underscore');
  console.log(_.uniqueId());
  console.log(second);
  return val * 4 + 1;
});

var mq = new Parsley.MessageQueue({
  host: 'localhost',
  port: 16379
});

var action = new Parsley.Action(sampleTask, 12, 'hejhej');
var dispatch = mq.dispatch(action);

mq.on('ready', function() {
  mq.end();
});

