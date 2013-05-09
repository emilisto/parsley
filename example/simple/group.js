var _ = require('underscore');
var Parsley = require('../..');

Parsley.config.redis = { port: 16379 };

var makeCommand = function(i) {
  return new Parsley.Command(function(i) {
    var n = Math.random() * 10e7;
    for(var j = 0; j < n; j++);
    return "return from task " + i + "random number" + new String(n | 0);
  }, i);
};

var commands = _(4).times(makeCommand);

new Parsley.Canvas.Group(commands).dispatch()
