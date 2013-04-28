var Parsley = require('..')

var mq = new Parsley.DispatchQueue({
  host: 'localhost',
  port: 16379
});

mq.listen(function(message) {

  mq.pop(function(err, dispatch) {

    if(!dispatch) throw new Error("no job available");

    var action = dispatch.action;
    var ret = action.run();
    console.log('ret: ', ret);

  });

});

//mq.on('ready', function() {
  //console.log('meeep');
  //return;

  //mq.pop(function(err, dispatch) {

    //if(!dispatch) throw new Error("no job available");

    //var action = dispatch.action;
    //var ret = action.run();
    //console.log('ret: ', ret);

    //setTimeout(function() {
      //mq.end();
    //}, 1000);

  //});

//});

