
var amqp = require('amqp');

var connection = amqp.createConnection({ host: '192.168.33.14' });

// Wait for connection to become established.
connection.on('ready', function () {
  // Use the default 'amq.topic' exchange
  connection.queue('my-queue', function(q){
      // Catch all messages
      q.bind('#');

      // Receive messages
      q.subscribe(function (message, headers, deliveryInfo) {
        // Print messages to stdout
        console.log('message: ', message);
        console.log('deliveryInfo: ', deliveryInfo);
      });
  });
});
