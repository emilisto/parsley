# parsley

A distributed task worker for node.js, inspired by Celery

Parsley lets you dispatch any function call to an arbitrarily large pool
of background workers. It offers flexible ways of combining tasks, so
that you can create complete workflows. Most is directly taken from
Celery's canvas primitives.

I'll write up a more thorough description soon, but in the meantime
here's an illustrative example

```javascript
var Parsley = require('parsley');

var identifyDependencies = function(code) {
  return ['underscore', 'jquery']
};

var installDependency = function(callback, dependency) {
  // Asynchronously install the dependency with npm
  setTimeout(callback, 300);
};

var run = function(code) {
  // evil
  eval(code);
};

// The parsley magic
var command = new Parsley.Canvas.Chain([

  new Parsley.Command(identifyDependencies, code),
  
  // Map the result of identifyDependencies to installDependency
  new Parsley.Canvas.ChordMap(installDependency),

  // Wait until all installDependency calls are finished

  new Parsley.Command(run, code, [ 'arguments', 'to', 'code' ])
]);


command.dispatch().get(function(err, result) {
  if(err) {
    console.log('ERROR:');
    console.log(result);
  } else {
    console.log('SUCCESS:');
    console.log(result);
  }
});
```

Once command is dispatched, the process that runs this code idles while
the background workers do the execution.

WARNING: parsley is currently highly experimental - I've just fleshed
out the idea and it's far from production-ready.

Licensed under MIT.
