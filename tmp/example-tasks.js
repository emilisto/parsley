var parsley = require('parsley');
var tasks = module.exports;

tasks.exampleTask = new parsley.Task(function() {
  console.log('doing serious shit');
});

module.exports = parsley.makeTasks({
  'exampleFn': function() {
    console.log('doing stuff');
  }
});
parsley.register(exampleFn);
