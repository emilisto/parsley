var mod = require('./submodule/mod');
var fn = mod.fn;

console.log(module.filename);
console.log(require.resolve('./submodule/mod'));


