var _ = require('underscore');
var Parsley = require('..'),
    Group = Parsley.Canvas.Group;

Parsley.config.redis = {
  host: 'localhost', port: 16379
};

var makeCommand = function(i) {
  return new Parsley.Command(function(i) {
    var n = Math.random() * 10e7;
    for(var j = 0; j < n; j++);
    return "return from task " + i;
  }, i);
};

var commands = _(4).times(makeCommand);

var group = new Group(commands)
  .dispatch()
  .get(function() {
    console.log('group results:');
    console.log(arguments);
  });

