//var parsley = require('parsley');
var tasks = require('./another/tasks');
var T = require('./sub/T');
var crypto = require('crypto');

var fn = function() {
  console.log('I do complicated stuff');
};

var hash = crypto.createHash('md5').update(fn.toString()).digest("hex");
console.log(hash);
process.exit(1);


//var fnTask = new Task(fn);

var looperTask = T('another/tasks.looperTask');
console.log(looperTask);

//tasks.looperTask();

//parsley.find('tasks.looperTask').apply_async();


// Dispatch code can't be run on the worker, hence the functions


// registered as tasks must be declared in globally accessible scope.

var dispatch = looperTask.applyAsync('arg1', 'arg2');
