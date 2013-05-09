var Parsley = require('../..');

Parsley.config.redis = { port: 16379 };

var fn = new Parsley.Command(function() {
  return 'Im some kind of result';
});

new Parsley.Command(function() {
  return "im from the initiating task";
})
  .link(new Parsley.Canvas.ChordMap(fn))
  .dispatch();


