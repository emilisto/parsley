
var Parsley = require('..')
var argv = require('optimist').argv;

var mq = new Parsley.DispatchQueue({ host: 'localhost', port: 16379 });
mq.listen();

mq.on('ready', function() {

  mq.on('dispatch', function(id) {
    // Here, make a decision if we want to pick it up or not, depending on how
    // many jobs we already have.
    mq.dequeue(id, function(err, dispatch) {
      console.log('got dispatch: ', dispatch);
    });
  });

});
