var _ = require('underscore');
var Parsley = require('..');

Parsley.config.redis = { port: 16379 };

new Parsley.Command(function() {

  var util = require('util');
  function CustomError() {};
  util.inherits(Error, CustomError);

  throw new CustomError('task is colaaaaaaaaaaapsing');
}).dispatch().get(function(err, result) {
  console.log('synchronous results is synchronous:', err);
  console.log(err.type);
});


