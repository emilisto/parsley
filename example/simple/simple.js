var Parsley = require('../..');

Parsley.config.redis = { port: 16379 };

new Parsley.Command(function simple() {
  return 'Im some kind of result';
}).dispatch() .get(function(err, result) {
  console.log('task result:', result);
});


