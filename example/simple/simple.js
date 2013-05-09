var Parsley = require('../..')

var sampleFn = function test(val) {
  return val * 2;
};

var callIt = function(fn) {
  return fn(10);
}


var sampleTask = new Parsley.Task(sampleFn);

console.log(String(sampleTask));
var json = sampleTask.serialize();

var task = Parsley.Task.deserialize(json);

var valBefore = callIt(sampleFn);
console.log('Before: ', valBefore);
console.log('After: ', task.fn(10));

//var action = new Parsley.Action(sampleTask, 123);
//action.run();

