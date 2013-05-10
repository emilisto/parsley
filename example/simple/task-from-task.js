var Parsley = require('../..');

Parsley.config.redis = { port: 16379 };

new Parsley.Command(function simple(callback) {

  var command = new this.Parsley.Command(function() {
    return 'I AM FREEEEEEE';
  }).dispatch();

  command.get(callback);

}).dispatch().get(function(err, result) {
  console.log('task result:', result);
});

