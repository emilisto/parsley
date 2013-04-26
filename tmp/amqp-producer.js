var amqp = require('amqp');

var connection = amqp.createConnection({ host: '192.168.33.14' });

// Wait for connection to become established.
connection.on('ready', function () {

  // Use the default 'amq.topic' exchange

  var e = connection.exchange('node-flow-fanout', {
    type: 'fanout'
  });

  connection.queue('my-queue', function(q){
    q.bind(e, "*");
    e.publish('test', { val: 123 });
    connection.end();

  });
});
