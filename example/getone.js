var Parsley = require('..')
var argv = require('optimist').argv;

var mq = new Parsley.DispatchQueue({ host: 'localhost', port: 16379 });

mq.on('ready', function() {
  var fn = function(err, data)  {
    if(err) {
      console.log('ERROR: ', err);
    } else {
      console.log('got it: ', data);
    }

    mq.end();
  };

  var id = argv._.pop();
  if(id) {
    console.log('fetching %s...', id);
    mq.dequeue(id, fn);
  } else {
    console.log('popping...');
    mq.pop(fn);
  }
});
