var Parsley = require('../..');

Parsley.config.redis = { port: 16379 };

var multiplyByEight = function(i) {
  return i * 8;
};

var command = new Parsley.Canvas.Chain([
  function() { return [ 1, 2, 3]; },
  new Parsley.Canvas.ChordMap(multiplyByEight),
  function(result) {
    var unary = function(fn) {
      return function(arg) { return fn(arg); };
    };
    return _.map(result, unary(parseInt));
  }
]);

command
  .dispatch()
  .get(function(err, result) {
    console.log('Result of multiplications:');
    console.log(result);
  });

