

var packageJson = require('../../package.json');

export const PKG_DEP_EXTERNALS = Object.keys(packageJson.dependencies);
export const PKG_EXTERNALS = PKG_DEP_EXTERNALS.concat(Object.keys(packageJson.peerDependencies || {}));
export const PKG_DEPS_ALL = PKG_EXTERNALS.concat(Object.keys(packageJson.devDependencies || {}));

export const NODE_BUILTIN_MODULES = ['assert', 'buffer', 'console', 'constants', 'crypto', 'domain', 'events', 'http', 'https', 'os', 'path', 'punycode', 'querystring', 'stream', 'string_decoder', 'timers', 'tty', 'url', 'util', 'vm', 'zlib'];



export const ELECTRON_BUILTINS = NODE_BUILTIN_MODULES.concat('electron');


export var excludeModules = NODE_BUILTIN_MODULES.concat(PKG_DEP_EXTERNALS);



//console.log(excludeModules)
//excludeModules.forEach(function (moduleName) {console.log((moduleName))});
//excludeModules.forEach(moduleName => console.log((moduleName)));