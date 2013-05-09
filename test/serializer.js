var _ = require('underscore')
  , assert = require('chai').assert
  , Serializer = require('../lib/parsley/serialize')
;

var serializationMap = {
  'id'         : 'normal',
  'commandset' : 'normal',
  'error'      : 'json',
  'arguments'  : 'json',
  'task'       : 'json'
};

var data = {
  'id': 'abc123',
  'task': {
    'complex': true,
    'more': 123,
    'even more': [ 'ein', 'zwei', 'drei' ]
  }
};

var serializer = new Serializer(serializationMap);

module.exports = {
  'serialization': {
    'basic serialization': function() {
      var serialized = serializer.serialize(data);
      assert(serialized);
      assert(!serialized.error, 'falsy values should not be included');
    },

    'data is the same serializing and then deserializing': function() {
      var serializer = new Serializer(serializationMap);
      var before = data;
      var after = serializer.deserialize(serializer.serialize(before));
      assert.deepEqual(before, after);
    }
  }
};


