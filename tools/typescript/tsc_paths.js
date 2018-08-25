const tsConfig = require('./tsconfig.json');
const tsConfigPaths = require('tsconfig-paths');


//MIGHT NEED THIS FOR PROD ENV
// example from https://github.com/bushybuffalo/nest-tsconfig-paths-example
// official: https://github.com/dividab/tsconfig-paths
// https://github.com/marzelin/convert-tsconfig-paths-to-webpack-aliases other implementation 


const baseUrl = './dist'; // Either absolute or relative path. If relative it's resolved to current working directory.
tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths,
});