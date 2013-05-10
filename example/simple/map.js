var Parsley = require('../..');

Parsley.config.redis = { port: 16379 };

var multiplyByEight = new Parsley.Command(function(i) {
  return i * 8;
});


new Parsley.Canvas.ChordMap(multiplyByEight)
  .dispatch([1, 2, 3])
  .get(function(err, result) {
    console.log('result');
    console.log(arguments);
  });


//var chordCommand = new Parsley.Canvas.ChordMap(multiplyByEight);
//var command = new Parsley.Canvas.Chain([
  //new Parsley.Command(function() {
    //return [ 1, 2, 3];
  //}),
  //chordCommand
//]).dispatch();

//console.log(command.id);
//chordCommand.get(function() {
  //console.log('coollers');
  //console.log(arguments);
//});


// Future
//new Parsley.Command(function() {
  //return [ 1, 2, 3];
//})
  //.link(new Parsley.Canvas.ChordMap(multiplyByEight))
  //.dispatch();


