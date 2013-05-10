var Parsley = require('..');

// FIXME: parse options and send to Worker

var worker = new Parsley.Worker();
worker.start();
process.send('online');

process.on('message', function(message) {
 if (message === 'shutdown') {
   worker.end();
   Parsley.end();
   process.exit(0);
 }
});
