var loopFn = function() {
  var n = Math.random() * 10e7 | 0

  for(i = 0; i < n; i++)
    ;
};


var task = new parsley.Task('examples.loopTask');

