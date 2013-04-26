var sub = require('lib/nested/sub');

exports.fn = function() {
  console.log('im in lib');
  sub.more_deep();
};
