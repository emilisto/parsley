var  _ = require('underscore')
  , introspect = require('introspect')
  , argumentsToArray = require('./common').argumentsToArray
;

var runCallbackStyle = function(fn, context, args, callback) {
  var _callback = function() {

    // FIXME: we must make sure to end all resources used by the task after
    // this callback is called. E.g. if the task opens up a web server
    // without closing, it will remain open forever.

    callback.apply(this, argumentsToArray(arguments));
  };

  args = [ _callback ].concat(args);

  setTimeout(function() {
    try {
      var ret = fn.apply(context, args);
      if(ret) {
        throw new Error('the first argument of the function is named callback'
                        + '- in which case Parsley expects it to not return'
                        + 'anything, but instead call callback when finished.');
      }
    } catch(err) {
      _callback(err);
    }
  });

};

var runReturnStyle = function(fn, context, args, callback) {

  setTimeout(function() {
    try {
      var ret = fn.apply(context, args);
      callback(null, ret);
    } catch(err) {
      callback(err);
    }
  });
};

var deserializeFunction = function(str) {

  // FIXME: this is very risky, find some way to assure it's indeed a
  // serialized function and nothing that executes immediately. Could
  // implement using some a sandbox environment, and a cache on the
  // hashed-string so we only decode each task function once.

  var fn;
  eval('fn = ' + str + ';');
  if(!fn) throw new Error('unable to de-serialize function: ' + str);

  return fn;
};


exports.run = (function() {

  // FIXME: deal with globally uncaught exceptions, e.g. in callbacks that are tied to IO.
  // http://stackoverflow.com/questions/5999373/how-do-i-prevent-node-js-from-crashing-try-catch-doesnt-work

  return function(fn, context, args, callback) {

    fn = deserializeFunction(fn);

    var argNames = introspect(fn);
    if(argNames.length && argNames[0] === 'callback') {
      runCallbackStyle(fn, context, args, callback);
    } else {
      runReturnStyle(fn, context, args, callback);
    }

  };

}());
