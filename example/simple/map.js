var Parsley = require('../..');

Parsley.config.redis = { port: 16379 };

var multiplyByEight = new Parsley.Command(function(i) {
  return i * 8;
});

new Parsley.Command(function() {
  return [ 1, 2, 3];
})
  .link(new Parsley.Canvas.ChordMap(multiplyByEight))
  .dispatch();


