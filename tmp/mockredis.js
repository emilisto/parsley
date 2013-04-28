var Parsley = require('..');
var redis = require('redis-mock');

var cq = new Parsley.CommandQueue({
  redis: redis,
  host: 'localhost',
  port: 16379
});

cq.listen();
cq.on('ready', function() {

  var task = new Parsley.Task(function(arg) {

    console.log(arg);

    var limit = Math.random() * 10e7 | 0;
    for(var i = 0; i < limit; i++)
      ;
    return limit;
  });

  cq.enqueue(task.defer(10), function() {
    cq.pop(function(err, command) {
      console.log('got one');
      console.log(command);
    });
  });

});
