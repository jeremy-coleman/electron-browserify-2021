
const path = require('path')
const {through_v1} = require('./browserify/streams')
const less = require('less')

const {PassThrough, Transform} = require('stream')
function lessify(file, opts) {

var input = '';
if (/\.less$/i.test(file) === false) {
  return new PassThrough();
}

function write(data) { input += data; }
function end() {
  var self = this;
  var lessOpts = (opts || {});
  var autoInject = typeof(lessOpts['auto-inject']) == 'undefined' || !!lessOpts['auto-inject'];
  //console.log('autoInject', autoInject)

  function jsToLoad(css) {
    var stringifiedCss = JSON.stringify(css);
    if (autoInject) {
      return "var css = "+ stringifiedCss +";(require('lessify'))(css); module.exports = css;";
    } else {
      return "module.exports = " + stringifiedCss;
    }
  }

  lessOpts.filename = file;
  lessOpts.paths = lessOpts.paths ? lessOpts.paths.concat([path.dirname(file)]) : [path.dirname(file)];

  less.render(input, lessOpts, function(err, output) {
    if (err) {
      self.emit('error', new Error(err.message + ': ' + err.filename + '(' + err.line + ')'));
    } 
    else {
      self.queue(jsToLoad(output.css));
    }
    output.imports.forEach(function(f) {
      self.emit('file', f);
    });
    self.queue(null);
  });
}

return through_v1(write, end);
}


module.exports = {
    lessify
}

//export {lessify, lessify as default}

// class LessStream extends Transform {
//   constructor(opts) {
//     super();
//     this._data = [];
//     this._opts = opts;
//   }

//   _transform(buf, enc, callback) {
//     this._data.push(buf);
//     callback();
//   }

//   _flush(callback) {
//     // Merge the buffer pieces after all are available
//     const data = Buffer.concat(this._data).toString();

//     try{
//       let result = sucrase.transform(data, this._opts)
//       var code = result !== null ? result.code : data;
//       this.push(code);
//       callback();
//     }
//     catch(e){
//       callback(e)
//     }
//   }
// }
