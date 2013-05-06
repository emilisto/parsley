var  _ = require('underscore')
  , introspect = require('introspect')
  , argumentsToArray = require('./common').argumentsToArray
;

var runCallbackStyle = function(fn, args, callback) {
    var _callback = function() {
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
        _callback(err);
      }
    });
};


exports.run = (function() {

  return function(fn, args, callback) {

    var args = introspect(fn);

    if(args.length && args[0] === 'callback') {
      runCallbackStyle(fn, args, callback);
    } else {
      runReturnStyle(fn, args, callback);
    }
  };

}());
