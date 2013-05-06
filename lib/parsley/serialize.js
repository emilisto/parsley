module.exports = {
  serializeException: function(error) {
    return {
      type    : error.constructor.name,
      message : error.message
    };
  }
};
