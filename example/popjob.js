var Parsley = require('..')

var mq = new Parsley.MessageQueue({
  host: 'localhost',
  port: 16379
});

mq.ready(function() {

  mq.pop(function(err, dispatch) {

    if(!dispatch) throw new Error("no job available");

    var action = dispatch.action;
    var ret = action.run();
    console.log('ret: ', ret);

    setTimeout(function() {
      mq.end();
    }, 1000);

  });

});


