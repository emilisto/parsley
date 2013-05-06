/*
 * Example task that opens up a web server on the task worker, waits for a
 * request and then returns the URL that was requested as the task result.
 */

var _ = require('underscore');
var Parsley = require('..');

Parsley.config.redis = { port: 16379 };

var command = new Parsley.Command(function(callback) {

  var http = require('http');

  var server = http.createServer(function (req, res) {
    res.writeHead(204, {'Content-Type': 'text/plain'});
    var data = req.url.slice(1);
    res.end();
    server.close();

    callback(null, data);

  }).listen(9615);

}).dispatch().get(function(err, result) {

  console.log('web server was hit with:');
  console.log(result);

});

