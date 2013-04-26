var Parsley = require('../lib/parsley');

var parsley = new Parsley({
  // FIXME: setup broker here
});

var sampleTask = new parsley.Task(function() {
  console.log('I am the function body');
});

// FIXME: setup the queue
var dispatcher = new parsley.Dispatcher();
dispatcher.async(sampleTask, 'this is an argument', 123);

//var dispatch = sampleTask.apply_async('args go here', 123);

var taskDone = new parsley.Task(function(ret) {

});

var action = new Action(sampleTask, 'this is an argument', 123);
action.addArguments('arguments inserted afterwards', { debug: false });
// Can link multiple times
action.link(task);
action.link(task);

var action = new GroupAction(task1, task2, task3);

// Run the action right away
action.run();

// Run on worker
parsley.dispatch(action);


