var  _ = require('underscore');

exports.assertParameters = function(options) {
  var parameters = Array.prototype.slice.call(arguments, 1);

  _.each(parameters, function(parameter) {
    if(!options.parameter) throw new Error('options.' + parameter + ' is required');
  });
};
