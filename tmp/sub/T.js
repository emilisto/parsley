module.exports = function T(id) {
  var parts = id.split('.'),
      moduleName = parts[0], taskName = parts[1];

  console.log(module.parent.children);
  if(moduleName === '') {

  }

  var task = require(moduleName)[taskName];
  return task;
};

