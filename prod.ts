var spawn = require('child_process').spawn
var fs = require('fs')
var path = require('path')
var browserify = require('browserify')
var watchify = require('watchify')
var tsify = require('tsify')
var babelify = require('babelify')
var _ = require('lodash')
var ts = require('typescript')
var tinyify = require('tinyify')
var ts = require('typescript')
var electron = require('electron')
//const livereactload = require('livereactload');
var gulp = require('gulp')
var jetpack = require('fs-jetpack')
var streamify = require('gulp-streamify')
var terser = require('gulp-terser')
var source = require('vinyl-source-stream')
var rename = require('gulp-rename')

import {getFileSize, POSTCSS_HOT_CONFIG, excludeModules, BABEL_PROD_CONFIG, BROWSERIFY_BASE_CONFIG, compileDesktop, PATHS} from './tools'

process.env.NODE_ENV == 'production'
process.env.BABEL_ENV == 'production'

compileDesktop()

function copyAppDir() {jetpack.copy('src', 'dist', {
  overwrite: true,
  matching: ['*.html', "*.ico","*.svg"]
 });
}
copyAppDir()


const b = browserify(BROWSERIFY_BASE_CONFIG)
b.exclude(excludeModules)
b.plugin(tsify)
b.transform(babelify.configure(BABEL_PROD_CONFIG))
b.transform(require('browserify-postcss'), POSTCSS_HOT_CONFIG)


b.plugin(tinyify, {
  env: {
    NODE_ENV: 'production',
    BABEL_ENV: 'production'
  }
}) 

b.on('error', console.log)
b.on('syntax', console.log)



//prod with launch

function launch() {
  console.log('launching electron')
  console.log(`BUNDLE SIZE: ${getFileSize(PATHS.client.OUT_FILE)}`)
  const child = spawn(electron, ['dist/desktop/main.js'], {detached: false, stdio: 'inherit'})
  child.on('close', () => {
    console.log('electron is done')
    process.exit(0)
  })
};

//@ts-ignore
launch = _.once(launch)

b.on('update', bundle)


async function bundle() {
  b.bundle()
    .on('error',console.error)
    .pipe(fs.createWriteStream(PATHS.client.OUT_FILE))
    .on('close',launch)
  console.log(`wrote ${PATHS.client.OUT_FILE}`)
}


bundle()





// function bundle() {
//   b.bundle()
//     .on('error',console.error)
//     .pipe(source('app.js'))
//     .pipe(streamify(terser()))
//     .pipe(rename('app.js'))
//     .pipe(gulp.dest(PATHS.client.dest))
//   console.log(`wrote ${PATHS.client.OUT_FILE}`) && console.log(`BUNDLE SIZE: ${getFileSize(PATHS.client.OUT_FILE)}`)
// }

// bundle()



// //the distribution bundle task
// gulp.task('bundle', function() {
//   var bundler = b.bundle()
//   return bundler
//     .pipe(source('index.js'))
//     .pipe(streamify(terser()))
//     .pipe(rename(PATHS.client.OUT_FILE))
//     .pipe(gulp.dest('./app'))
// })