var Parsley = require('..');

var task = new Parsley.Task(function() {
  var limit = Math.random() * 10e7 | 0;
  for(var i = 0; i < limit; i++)
    ;
  return limit;
});
var allFinished = function() {
  console.log('all tasks finished!');
  console.log(arguments);
};

//
// Basic run of a task
//
var result = task.dispatch('first argument', 123);
result.get(function(ret) {
  console.log('ret: ', ret);
})


//
// Create a command
//
var command = task.defer(123);
command.link(task.defer(456));
var result = command.dispatch();


//
// Create a chain
//
var command = Parsley.chain([
  task.defer('first'), task.defer('second'), task.defer('third')
]);
command.link(allFinished);
var result = command.dispatch();


//
// Create a chords
//
var result = Parsley.chord([
   task.defer('first'), task.defer('second'), task.defer('third')
], allFinished)
  // Here a task is automatically created for this function
  .link(function(ret) {
    // Here's the result for all tasks in the chord
  })
  .dispatch();

result.get(function(ret) {
  // Here we only get the result from the chord task - that the chord is created
});


//
// Complex workflow
//

var parallelMap = new Parsley.Task(function(args, task) {
  var result = new Parsley.DeferredResult();

  var group = new Parsley.Group(
    _.map(args, function(arg) { return task.defer(arg); }),
    new Parsley.Task(function(ret) { result.resolve(ret); })
  );

  return result;
});


var tasks = {

  installDependency: new Parsley.Task(function(dependency) {
    // Asynchronous result - a promise basically
    var result = new Parsley.DeferredResult();

    setTimeout(function() {
      result.resolve('i am the output');
    }, 1000)

    return result;
  }),

  identifyDependencies: new Parsley.Task(function(src) {
    return dependencies;
  }),

  run: new Parsley.Task(function(src, vm) {
    // Asynchronous result - a promise basically
    var result = new Parsley.DeferredResult();

    setTimeout(function() {
      result.resolve('i am the output');
    }, 1000)

    return result;
  }),

  startVm: new Parsley.Task(function() {
    var result = new Parsley.DeferredResult();
    result.resolve(vmObject);
    return result;
  })

};

var dispatchTask = new Parsley.Task(function(body) {

  var result = Parsley.chain([
    tasks.identifyDependencies.defer(body.src),
    parallelMap.defer(tasks.installDependency),
    tasks.startVm,
    tasks.run.defer(body.src)
  ]).dispatch();

  result.get(function(vm, src) {

    // All tasks were executed when this is run

  });

});
