var _ = require('underscore')
  , logging = require('./logging')
  , uuid = require('uuid')
;

var serializeFunction = function(fn) {
  return fn.toString();
};

var Task = function Task(fn, options) {
  options = options || {};

  if(_.isFunction(fn)) fn = serializeFunction(fn);

  // Later on, we intend to add support for tasks whose code is specified by a
  // module path.
  this.format = 'serialized';
  this.fn = fn;
  this.name = this.fn.name || uuid.v4().toString();

  var logger = logging.getLogger('Parsley.Task');
  logger.extend(this);
};

_.extend(Task.prototype, {

  serialize: function() {
    var data = {
      name   : this.name,
      fn     : this.fn,
      format : this.format
    };

    return data;
  },

  defer: function() {
    // To avoid circular imports
    var Command = require('./command.js').Command;
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

Task.make = function(obj) {
  var task;
  if(_.isFunction(obj)) {
    task = new Task(obj);
  } else if(obj instanceof Task) {
    task = obj;
  } else if(_.isString(obj)) {
    task = new Task(obj);
  } else {
    throw new Error('obj is of invalid type');
  }
  return task;
};

Task.deserialize = function(data) {
  options = _.clone(data);

  switch(data.format) {
    case 'serialized':
      if(!data.fn) throw new Error('fn attribute missing');
      fn = data.fn;
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
