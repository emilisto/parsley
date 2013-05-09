var Parsley = require('../..');

Parsley.config.redis = { port: 16379 };

var fn = new Parsley.Command(function() {

  console.log('Task itself');
  console.log(arguments);
  console.log(this);

  return 'Im some kind of result';
});

new Parsley.Canvas.Command(fn)
  .dispatch()
  .get(function(err, result) {
    console.log('task result:', result);
  });

