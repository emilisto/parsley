var Parsley = require('..');

Parsley.config.redis = {
  host: 'localhost', port: 16379
};

var task = new Parsley.Task(function(arg) {
  console.log('im the task biatch: ', arguments);
  var limit = Math.random() * 10e7 | 0;
  //for(var i = 0; i < limit; i++)
    //;
  return limit;
});

//var str = '{"name":"768fc612-2429-4059-a961-a83d10c46eb9","fn":"function (arg) {\n  var limit = Math.random() * 10e7 | 0;\\n  for(var i = 0; i < limit; i++)\\n    ;\n  return limit;\\n}","format":"serialized"}';
////var str = '{"name":"768fc612-2429-4059-a961-a83d10c46eb9"}';
//var data = JSON.parse(str);
//console.log(data);
//console.log(JSON.parse(JSON.stringify(data)));

var command2 = new Parsley.Command(function() {
  console.log('moooore');
});

var command = new Parsley.Command(task, 'this is an argument', 123);
command.link(command2);

var result = command.dispatch();
result.get(function(err, result) {
  console.log('results:');
  console.log(result);
});

//var cq = new Parsley.CommandQueue();
//cq.enqueue(command);

//command.save(function() {
  //Parsley.Command.fetch(command.id, function(err, command) {
    //command.run();
  //});
//});
