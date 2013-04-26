var parsley = require('..')
  , assert = require('assert')
;

module.exports = {

  'one case': function() {
    assert(1+1 === 2);
  },

  'bad case': function() {
    assert(false);
  },



};
