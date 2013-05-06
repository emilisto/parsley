var _ = require('underscore');
var Parsley = require('..');

Parsley.config.redis = { port: 16379 };

new Parsley.Command(function(callback) {

  // Spending time
  setTimeout(function() {
    callback(null, 'Im an asynchronous return value');
  }, 1000);

}).dispatch().get(function(err, result) {

  console.log('asynchronous result is asynchronous: ', result);

});

new Parsley.Command(function() {

  // Spending time
  for(var i = 0; i < 10e7; i++);
  return 'Im some kind of result';

}).dispatch() .get(function(err, result) {
  console.log('synchronous results is synchronous: ', result);
});

