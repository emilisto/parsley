var Parsley = require('..')
;

Parsley.config.redis = { host: 'localhost', port: 16379 };

var command = new Parsley.Command(function(arg) {
  return "I'm from the task";
}, 'and then some', 123, 'arguments');

var startTime = +new Date;
command.dispatch().get(function() {
  var delta = +new Date - startTime;
  console.log('Runtime: %d ms', delta);
  Parsley.end();
});
