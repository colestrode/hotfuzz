var fs = require('fs')
  , EventEmitter = require('events').EventEmitter
  , reloadEmitter = new EventEmitter()
  , watchers = {}
  , jsRequire = require.extensions['.js']
  , requireRegex = /require\([',"]([\.,\\,\@,\/,\$,_,-,0-9,a-z]+)[',"]\)/gmi
  ;

function isNodeModule(filePath) {
  return /node_modules/gi.test(filePath);
}

function getRequiredLibs(filePath) {
  var contents = fs.readFileSync(filePath, {encoding: 'UTF-8'})
    , libs = []
    , lib = requireRegex.exec(contents);

  //TODO allows dups and ignores extensions (app and app.js)
  while(lib && lib.length) {
    libs.push(lib[1]);
    lib = requireRegex.exec(contents);
  }

  console.log(libs);
}

module.exports.getRequiredLibs = getRequiredLibs;

require.extensions['.js'] = function(module, filename) {
  if(!isNodeModule(filename) && !watchers[filename]) {
    watchers[filename] = fs.watchFile(filename, function() {
      console.log('clearing cache for ' + filename);
      delete require.cache[filename];
    });
  }

  getRequiredLibs(filename);

  jsRequire(module, filename);
  reloadEmitter.emit('hf-reload', filename);
};