function findModuleTree() {
  var tree = [],
      _module = module;

  while(!_module.parent) {
    tree.push(_module.id);
    _module = _module.parent;
  }

  return tree;
};

exports.more_deep = function() {
  console.log(module);
  console.log('find out where Im from');
};
