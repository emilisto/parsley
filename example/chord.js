var _ = require('underscore');
var Parsley = require('..');

Parsley.config.redis = {
  host: 'localhost', port: 16379
};

var launchParallel = function(commands) {
  _.each(commands, function(command) {
    command.dispatch();
  });
};

var launchSerial = function(commands) {

};

var makeCommand = function(i) {
  return new Parsley.Command(function(i) {
    var n = Math.random() * 10e7;
    for(var j = 0; j < n; j++);
    return "return from task " + i;
  }, i);
};

var commands = _(4).times(makeCommand);

var finalCommand = new Command(function(results) {
  return results;
});

var commandset = new Parsley.CommandSet(commands)
  .link(finalCommand)
  .save(function() {
    launchParallel(commands);
  });

finalCommand.get(function(err, ret) {
  console.log('finished!!!');
  console.log(ret);
});

// Alright, now we launch these commands in different ways

//launchSerial(commands);

//process.exit();
//var result = chord.dispatch();
//result.get(function() {
  //console.log('results from all child commands');
  //console.log(arguments);
//});

