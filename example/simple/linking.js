var Parsley = require('../..');

Parsley.config.redis = { port: 16379 };

var multiplyByEight = new Parsley.Command(function(i) {
  console.log('multiplyByEight');
  console.log(arguments);
  return i * 8;
});

new Parsley.Canvas.Chord([ multiplyByEight ])
  .dispatch(3)
  .link(function(result) {
    console.log('LINKED:');
    console.log(result);
  })
