# Small things

## Logging?
Options:

- `this.logger` - i.e. override the context of all task functions
- parsley.log(...) - find out from where we're executing in the logger

- Make a logger that works like:

```
var parsley = require('parsley'),
    fn = require('module').fn;
var task = new parsley.Task(function() {
  parsley.getLogger()
});
```
