var Parsley = require('../..');

Parsley.config.redis = { port: 16379 };

var multiplyByEight = new Parsley.Command(function(i) {
  return i * 8;
});

var command = new Parsley.Canvas.Chain([
  new Parsley.Command(function() {
    return [ 1, 2, 3];
  }),
  new Parsley.Command(function(result) { return result; }),
  new Parsley.Canvas.ChordMap(multiplyByEight),
  new Parsley.Command(function(result) {
    var unary = function(fn) {
      return function(arg) { return fn(arg); };
    };
    return _.map(result, unary(parseInt));
  })
]).dispatch();

command.get(function(err, result) {
  console.log('Result of multiplications:');
  console.log(result);
});

