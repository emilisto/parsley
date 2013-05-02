
var Parsley = require('..')
var argv = require('optimist').argv;

var mq = new Parsley.CommandQueue();
mq.listen();

mq.on('ready', function() {
  mq.on('command', function(id) {

    // Here, make a decision if we want to pick it up or not, depending on how
    // many jobs we already have.
    mq.dequeue(id, function(err, command) {
      if(command) command.run();
    });

  });
});
