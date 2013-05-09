var Parsley = require('..')
  , assert = require('chai').assert
;

// Disable logging
Parsley.Logging.config.transports = {
  console: { level: 'error' }
};

module.exports = {

  // TODO: Add more unit test-style tests here, that don't require a running
  // Parsley worker, and in turn a Redis instance.

};
