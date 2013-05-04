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

var commands = _.map([
  function() {
    return "ret task 1";
  },
  function() {
    return "ret task 2";
  },
  function() {
    return "ret task 3";
  }
], function(fn) {
  return new Parsley.Command(fn);
});

var commandset = new Parsley.CommandSet(commands);
commandset.link(function() {
  console.log('all tasks finished');
  console.log(arguments);
});
commandset.save(function() {
  console.log('saved it:');
  console.log(arguments);
  launchParallel(commands);
});

// Alright, now we launch these commands in different ways

//launchSerial(commands);

//process.exit();
//var result = chord.dispatch();
//result.get(function() {
  //console.log('results from all child commands');
  //console.log(arguments);
//});

