var path = require('path')
const { Transform, PassThrough } = require('stream')
const fs = require('fs')
const projectSourceDirectory = path.resolve(process.cwd(), 'src')
const sourceDirs = fs.readdirSync(projectSourceDirectory).filter(f => !f.includes("."))

//todo , merge this with fs read tsconfig + user options + maybe like a web_modules
let createConfig = () => {
  const config = {
    baseUrl: ".",
    paths: {}
  }
  for (var x of sourceDirs) {
    config.paths[`${x}/*`] = [`src/${x}/*`]
  }
  //return JSON.stringify(config)
  return config
}
const compilerOptions = createConfig()

const dynamicImportRegexp = (v) => {
  //if(v !== typeof 'string') return v;
  const patternDImport = v.match(/import\((?:["'\s]*([\w*{}\n\r\t, ]+)\s*)?["'\s](.*([@\w_-]+))["'\s].*\);$/, 'mg')
  if(patternDImport){
    console.log(patternDImport)
    let initial = patternDImport[0]
    let replacement = `(Promise.resolve(require("${patternDImport[2]}")))`
    console.log(initial)
    console.log(replacement)
    v.replace(patternDImport[0], replacement)
    //return v
  }
  //return v
}

const findImport = (line) => {
  //dynamicImportRegexp(line)
  const matches = line.match(/from (["'])(.*?)\1/) || line.match(/import\((["'])(.*?)\1\)/) || line.match(/require\((["'])(.*?)\1\)/);
  if (!matches) {
    return null;
  }
  //const multiple = 
  [/from (["'])(.*?)\1/g, /import\((["'])(.*?)\1\)/g, /require\((["'])(.*?)\1\)/g].some((exp) => {
    const results = line.match(exp);
    //console.log(results) return results && results.length > 1
    if (results && results.length > 1) { results.map(r => findImport(r)) }
  })
  return matches[2];
}


function compile(filePath, chunk) {
  const { baseUrl, paths } = compilerOptions
  const aliases = {};
  const file = chunk.split('\n')
  const lines = [...file]

  const imports = lines.map((line, index) => {
    const importLines = findImport(line);
    if (importLines === null) { return null }
    return {
      path: filePath,
      index: index,
      import: importLines,
    }
  }).filter((value) => value !== null && value !== undefined);


  Object.entries(paths).forEach(([absoluteKey, ...relativePathValues]) => {
    let resolved = absoluteKey;
    if (absoluteKey.endsWith('/*')) {
      resolved = absoluteKey.replace('/*', '/');
    }
    aliases[resolved] = paths[absoluteKey];
  })

  for (const imported of imports) {
    const line = file[imported.index];
    let resolved = '';
    for (const alias in aliases) {
      if (aliases.hasOwnProperty(alias) && imported.import.startsWith(alias)) {
        const choices = aliases[alias];

        if (choices != undefined) {
          resolved = choices[0];
          if (resolved.endsWith('/*')) { resolved = resolved.replace('/*', '/'); }
          resolved = imported.import.replace(alias, resolved);
          break;
        }
      }
    }

    if (resolved.length < 1) { continue; }
    
    // let rel_from  = path.dirname(imported.path)
    // let rel_to    = path.resolve(path.dirname(imported.path), path.join(path.relative(path.dirname(imported.path), baseUrl || './'), resolved))
    // let relative  = path.relative(rel_from, rel_to).replace(/\\/g, '/');

    let relative =
      path.relative(
        path.dirname(imported.path),
        path.resolve(path.dirname(imported.path), path.join(path.relative(path.dirname(imported.path), baseUrl || './'), resolved))
      ).replace(/\\/g, '/');

    if (relative.length === 0 || !relative.startsWith('.')) { relative = './' + relative; }
    lines[imported.index] = line.replace(imported.import, relative);
  }
  return lines.join('\n')
}

const unpathifyStream = (file) => {
  if (!/\.tsx?$|\.jsx?$/.test(file) || file.indexOf("node_modules") > 0 || file.indexOf("src") < 0) {
    return new PassThrough();
  }
  var _transform = new Transform()
  _transform._write = (chunk, encoding, next) => {
    _transform.push(compile(file, chunk.toString('utf8')))
    next();
  }
  return _transform
}

module.exports = unpathifyStream


// let relative = 
// path.relative (
//   path.dirname(importDescription.path), path.resolve(path.dirname(importDescription.path),
//   path.join(path.relative(path.dirname(importDescription.path), baseUrl || './'), importDescription.import.replace(absoluteKey, resolved)))
// ).replace(/\\/g, '/')

// function resolveImports(file, imports, options) {
//   const { baseUrl, paths } = compilerOptions
//   const aliases = {};
//   const lines = [...file];

//   Object.entries(paths).forEach(([absoluteKey, ...relativePathValues]) => {
//     let resolved = absoluteKey;
//     if (absoluteKey.endsWith('/*')) {
//       resolved = absoluteKey.replace('/*', '/');
//     }
//     aliases[resolved] = paths[absoluteKey];
//   })

//   for (const imported of imports) {
//     const line = file[imported.index];
//     let resolved = '';

//     for (const alias in aliases) {
//       if (aliases.hasOwnProperty(alias) && imported.import.startsWith(alias)) {
//         //console.log(true)
//         const choices = aliases[alias];

//         if (choices != undefined) {
//           resolved = choices[0];
//           if (resolved.endsWith('/*')) {
//             resolved = resolved.replace('/*', '/');
//           }
//           resolved = imported.import.replace(alias, resolved);
//           break;
//         }
//       }
//     }

//     if (resolved.length < 1) {
//       continue;
//     }

//     let relative = 
//       path.relative(
//         path.dirname(imported.path),
//         path.resolve(path.dirname(imported.path), path.join(path.relative(path.dirname(imported.path), baseUrl || './'), resolved))
//       ).replace(/\\/g, '/');

//     if (relative.length === 0 || !relative.startsWith('.')) {
//       relative = './' + relative;
//     }
//     lines[imported.index] = line.replace(imported.import, relative);
//   }
//   return lines;
// }
// function compile1(filePath, chunk) {
//   //const lines = chunk.toString('utf8').split('\n');
//   const lines = chunk.split('\n');
//   return resolveImports(lines, parseImports(lines, filePath), compilerOptions).join('\n')
// }