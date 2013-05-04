var _ = require('underscore');
var Parsley = require('..');

var Command = require('../lib/parsley/command');

Command.incrementAndCheckCompleted('test', function() {
  console.log('callbacl!');
  console.log(arguments);
});
