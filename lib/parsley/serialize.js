var _ = require('underscore');

var Serializer = function(serializationMap) {
  this.types = _.clone(this.defaultTypes);
  if(!serializationMap) throw new Error('no serializationMap provided');
  this.serializationMap = this._prepareSerializationMap(serializationMap);
};

_.extend(Serializer.prototype, {

  defaultTypes: {
    'normal': {
      'serialize': function(val) { return val; },
      'deserialize': function(val) { return val; }
    },
    'json': {
      'serialize': function(val) { return JSON.stringify(val); },
      'deserialize': function(val) { return JSON.parse(val); }
    },
    'exception': {
      'serialize': function(error) {
        // TODO: add more serialization logic here, e.g. if error is not an exception
        return JSON.stringify({
          type    : error.constructor.name,
          message : error.message
        });
      },
      'deserialize': function(val) { return JSON.parse(val); }
    },

    'command': {
      'serialize': function(val) { return val.id ?  val.id : val; },
      'deserialize': function(val) { return val; }
    },

    'commands': {
      'serialize': function(arr, attr) {
        if(arr && !_.isArray(arr)) {
          throw new SerializerError('callbacks("' + attr + '"): must be Array unless undefined');
        }

        return JSON.stringify(_.map(arr || [], function(val) {
          return val.id ?  val.id : val;
        }));

      },
      'deserialize': function(val) { return JSON.parse(val); }
    }
  },

  _validateType: function(type) {
    return type && _.isFunction(type['serialize']) && _.isFunction(type['deserialize']);
  },

  _prepareSerializationMap: function(map) {
    var self = this;
    return _.object(
      _.map(map, function(type, attr) {
        if(_.isString(type)) type = self.types[type];
        if(!self._validateType(type)) throw new Error('invalid type "' + type + ' " for attribute "' + attr + '"');
        return [ attr, type ];
      })
    );
  },

  serializeOne: function(attr, val) {
    return this.serializationMap[attr].serialize(val, attr);
  },
  deserializeOne: function(attr, val) {
    return this.serializationMap[attr].deserialize(val, attr);
  },


  serialize: function(obj) {
    var self = this;

    return _.object(
      _.map(this.serializationMap, function(type, attr) {
        var val = obj[attr];
        if(!val) return;
        return [ attr, type.serialize(val, attr) ];
      })
      .filter(_.identity)
    );
  },

  deserialize: function(obj) {
    var self = this;
    return _.object(
      _.map(obj, function(val, attr) {
        var type = self.serializationMap[attr];
        if(!type) throw new Error('deserialize(): unknown attribute ' + attr);

        return [ attr, type.deserialize(val, attr) ];
      })
    );
  }

});

module.exports = Serializer;
