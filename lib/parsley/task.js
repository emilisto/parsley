var _ = require('underscore')
  , logging = require('./logging')
  , uuid = require('uuid')
  , Command = require('./command')
;

var serializeFunction = function(fn) {
  return fn.toString();
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

var Task = function Task(fn, options) {
  options = options || {};

  if(_.isFunction(fn)) {
    this.fn = fn;
  } else {

    // TODO: find a way to save where this task resides so that worker can
    // include it. (the "10.000 crown question")

    throw new Error('creating tasks from require\'able functions is not implemented yet');
    this.requirePath = '...';
  }

  this.name = this.fn.name || uuid.v4().toString();

  var logger = logging.getLogger('Parsley.Task');
  logger.extend(this);
};

_.extend(Task.prototype, {

  serialize: function() {
    var data = {
      name: this.name
    };

    if(this.requirePath) {
      throw new Error('not implemented');
      data.requirePath = this.requirePath;
      data.format = 'require';
    } else {
      data.fn = serializeFunction(this.fn);
      data.format = 'serialized';
    }

    return data;
  },

  defer: function() {
    var command = new Command(this);
    command.addArguments(arguments);
    return command;
  },

  run: function() {
    return this.defer.apply(this, arguments).run();
  },

  toString: function() {
    return JSON.stringify(this.serialize());
  }

});

Task.deserialize = function(data) {
  options = _.clone(data);

  switch(data.format) {
    case 'serialized':
      if(!data.fn) throw new Error('fn attribute missing');
      fn = deserializeFunction(data.fn);
      break;
    case 'require':
      throw new Error('not implemented');
      break;
    default:
      throw new Error('invalid format: ' + data.format);
  }

  delete options.fn;
  delete options.format;

  return new Task(fn, options);
};


module.exports = Task;
