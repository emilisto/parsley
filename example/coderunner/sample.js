function fn(callback) {

  var request = require('request');
  request('http://myhostname.net', {
    'headers': { 'user-agent': 'curl' }
  }, function (error, response, body) {
    console.log(body);
    callback(null, body);
  })

}
