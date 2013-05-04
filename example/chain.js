var _ = require('underscore');
var Parsley = require('..');

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

var commands = _(4).times(makeCommand);

new Parsley.Canvas.Chain(commands)
  .dispatch()
  .get(function() {
    console.log('chain results:');
    console.log(arguments);
  });


