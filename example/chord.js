var Parsley = require('..');

Parsley.config.redis = {
  host: 'localhost', port: 16379
};

var chord = new Parsley.Canvas.BaseChord([
  function() {
    return "ret task 1";
  },
  function() {
    return "ret task 2";
  }
  function() {
    return "ret task 3";
  }
]).link(function() {
  console.log('all tasks finished');
  console.log(arguments);
});

var result = chord.dispatch();
result.get(function() {
  console.log('results from all child commands');
  console.log(arguments);
});

