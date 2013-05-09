var  _ = require('underscore')
  , introspect = require('introspect')
  , argumentsToArray = require('./common').argumentsToArray
;

var runCallbackStyle = function(fn, args, callback) {
  var _callback = function() {

    // FIXME: we must make sure to end all resources used by the task after
    // this callback is called. E.g. if the task opens up a web server
    // without closing, it will remain open forever.

    callback.apply(this, argumentsToArray(arguments));
  };

  args = [ _callback ].concat(args);

  setTimeout(function() {
    try {
      var ret = fn.apply(null, args);
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

var runReturnStyle = function(fn, args, callback) {

  setTimeout(function() {
    try {
      var ret = fn.apply(null, args);
      callback(null, ret);
    } catch(err) {
      callback(err);
    }
  });
};

exports.run = (function() {

  // FIXME: deal with globally uncaught exceptions, e.g. in callbacks that are tied to IO.
  // http://stackoverflow.com/questions/5999373/how-do-i-prevent-node-js-from-crashing-try-catch-doesnt-work

  return function(fn, args, callback) {

    var argNames = introspect(fn);
    if(argNames.length && argNames[0] === 'callback') {
      runCallbackStyle(fn, args, callback);
    } else {
      runReturnStyle(fn, args, callback);
    }

  };

}());
