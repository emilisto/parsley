
(function() {

  var originalFn = function (arg) {
    console.log("arg: %o", arg);
  };

  var fn;

  var strFn = 'fn = ' + originalFn.toString() + ';';
  eval(strFn);
  console.log(fn);

}());
(function() {

  var fn;

  var strFn = 'function test(arg) { console.log("arg: %o", arg); }';
  strFn = 'fn = ' + strFn + ';';
  eval(strFn);
  console.log(fn);

}());



