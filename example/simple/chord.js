var _ = require('underscore');
var Parsley = require('../..');

Parsley.config.redis = {
  host: 'localhost', port: 16379
};

var makeCommand = function(i) {
  return new Parsley.Command(function(i) {
    var n = Math.random() * 10e7;
    for(var j = 0; j < n; j++);
    return "return from task " + i + "random number" + new String(n | 0);
  }, i);
};

var commands = _(1).times(makeCommand);

new Parsley.Canvas.Chord(commands)
  .dispatch()
  .get(function(err, result) {
    console.log('chord finished, results of each command:');
    console.log(result);
  });

