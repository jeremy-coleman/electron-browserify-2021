var gulp = require("gulp")
var path = require('path')

var spawn = require('child_process').spawn
var browserify = require('browserify')
var watchify = require('watchify')
var tsify = require('tsify')
var babelify = require('babelify')
var electron = require('electron')
var reactHMR = require("livereactload")
var jetpack = require('fs-jetpack')
var source = require("vinyl-source-stream")
var buffer = require("vinyl-buffer")
var envify = require("envify")
var typescript = require('gulp-typescript').createProject('tsconfig.json')
var _ = require('lodash')
import * as fs from 'fs'

var livereload = require('gulp-livereload');
var pug = require('gulp-pug')


var postcss = require('gulp-postcss')
var concat = require('gulp-concat')
var sass = require('gulp-sass')
var sourcemaps = require('gulp-sourcemaps')
var merge = require('merge-stream');
var purgecss = require('@fullhuman/postcss-purgecss')
var less = require('gulp-less')
var stylus = require('gulp-stylus')

var streamify = require('gulp-streamify')
var terser = require('gulp-terser')
var source = require('vinyl-source-stream')
var rename = require('gulp-rename')

var del = require('del')

var commonShake = require('common-shakeify')

import {getFileSize, POSTCSS_HOT_CONFIG, excludeModules, BABEL_HOT_CONFIG, BROWSERIFY_BASE_CONFIG, compileDesktop, PATHS} from '..'

gulp.task('clean:dist', () => del(['dist']));

// gulp.task('clean:dist', function () {
//   return del(['dist/'])
// })


// gulp.task('clean:dist', function(done) {
//      jetpack.removeAsync('dist').then(done())
// })

// gulp.task('copy:assets',(done) => {
//     jetpack.copy('src', 'dist', {
//       overwrite: true,
//       matching: ['*.html', "*.ico"]
//       //matching: ['*.html', "*.ico","*.svg"]
//      }),
//      done()
// })

gulp.task('tsc:desktop', () => {
  return gulp.src(PATHS.electron.src)
    .pipe(typescript())
    .pipe(gulp.dest(PATHS.electron.dest))
})

const b = watchify(browserify(BROWSERIFY_BASE_CONFIG))

b.exclude(excludeModules)
b.plugin(tsify)
b.transform(babelify.configure(BABEL_HOT_CONFIG))
b.transform(require('browserify-postcss'), POSTCSS_HOT_CONFIG)
b.plugin(reactHMR, {host: 'localhost',port: 1337})
b.on('error', console.log)
b.on('syntax', console.log)


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
    .on('close', launch)
  console.log(`wrote ${PATHS.client.OUT_FILE}`)
}


gulp.task('pug', function html () {
  return gulp.src(PATHS.client.SRC_PUG_INDEX)
    .pipe(pug())
    .pipe(gulp.dest(PATHS.client.dest))
    .pipe(livereload())
})


gulp.task('app:postcss', () => {
  
 var stylusStream = gulp.src(['src/**/*.styl'])
          .pipe(concat('stylus-temp.styl'))
          .pipe(stylus())
          .pipe(postcss())
  
 var lessStream = gulp.src(['src/**/*.less'])
          .pipe(concat('less-temp.less'))
          .pipe(less())
          .pipe(postcss())
          //.pipe(concat('scss-temp.css'))
  
  var scssStream = gulp.src(['src/**/*.scss', 'src/**/*.sass'])
          .pipe(sass({outputStyle: 'compressed'})).on('error', sass.logError)
          .pipe(postcss())
          //.pipe(concat('scss-temp.css'))

  var cssStream = gulp.src('./src/**/*.css')
          .pipe(postcss())
          //.pipe(concat('css-temp.css'))
          
return merge(lessStream, scssStream, cssStream)
            .pipe(concat('styles.min.css'))
            .pipe(postcss())
            .pipe(gulp.dest('dist/client'))
            .pipe(livereload())

//done()
  }
);

gulp.task('watch', async () => {
  livereload.listen();
  //gulp.watch(PATHS.client.src, gulp.series('tsc:client'))
  gulp.watch(PATHS.client.SRC_PUG_INDEX, gulp.series('pug'))
  gulp.watch(PATHS.client.SRC_STYLES, gulp.series('app:postcss'))
})


gulp.task('start',  gulp.series('clean:dist', 'tsc:desktop', 'pug', 'app:postcss', bundle, 'watch'))

//gulp.task('start',  gulp.series('clean:dist', 'copy:assets', 'tsc:desktop', 'pug', 'app:postcss', bundle, 'watch'))

//works
// gulp.task("watch:js", async () => {
//    b.on('update', bundle)
//    bundle()
// })



//var nodemon    = require("gulp-nodemon"),
// gulp.task("watch:server", function() {
//   nodemon({ script: "server.js", ext: "js", ignore: ["gulpfile.js", "bundle.js", "node_modules/*"] })
//     .on("change", function () {})
//     .on("restart", function () {
//       console.log("Server restarted")
//     })
// })

// gulp.task("default", ["watch:server", "watch:js"])