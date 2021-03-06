var CodeRunner = require('parsley/contrib/coderunner');
var fs = require('fs');
var optimist = require('optimist')
  .usage('Usage: $0 <path-to-script>');

var fail = function(e) {
  optimist.showHelp();
  console.error('ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
};

try {
  var path = optimist.argv._.pop();
  var code = fs.readFileSync(path).toString();

  var startTime = +new Date;

  new CodeRunner({ redisPort: 16379 })
    .run(code, [ 123 ])
    .get(function(err, result) {

      var delta = +new Date - startTime;
      console.log('Runtime: %d ms', delta);

      if(err) {
        console.log('FAILED: %s', err);
      } else {
        console.log('SUCCEEDED: %s', result);
      }

    });

} catch(e) {
  fail(e);
}
