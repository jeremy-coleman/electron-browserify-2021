var gulp = require("gulp");
var path = require("path");
var fs = require("fs");
var spawn = require("child_process").spawn;
var browserify = require("browserify");
var {watchify} = require("./tools/watchify");
//var tsify = require("tsify");
var babelify = require("babelify");
var electron = require("electron");
var reactHMR = require("./tools/transforms/livereactload");
var _ = require("lodash");
var livereload = require("gulp-livereload");
var pug = require("gulp-pug");
var postcss = require("gulp-postcss");
var concat = require("gulp-concat");
var sass = require("gulp-dart-sass");
var merge = require("merge-stream");
var less = require("./tools/gulp-plugins/gulp-less");
var stylus = require("gulp-stylus");
var del = require("del");
var typescript = require("gulp-typescript").createProject("tsconfig.json");
const { builtinModules } = require("module");

var tsxify = require('./tools/transforms/tsify')
var sucrasify = require('./tools/transforms/sucrasify')

//make sure react-hot-loader is in dev dependencies and you exclude it
const excludeModules = builtinModules.concat(
  Object.keys(require("./package.json").dependencies)
);

const PATHS = {
  STYLES: [
    "./src/**/*.css",
    "src/**/*.scss",
    "src/**/*.sass",
    "src/**/*.styl",
    "src/**/*.less"
  ],
  OUT_FILE: path.join("dist", "client", "app.js"),
  OUT_DIR: "dist/client/"
};

function getFileSize(filePath) {
  var size = fs.statSync(filePath).size;
  var i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    (size / Number(Math.pow(1024, i))).toFixed(2) +
    " " +
    ["B", "KB", "MB", "GB", "TB"][i]
  );
}

gulp.task("clean:dist", () => del(["dist"]));

gulp.task("tsc:desktop", () => {
  return gulp
    .src("src/desktop/main.ts")
    .pipe(typescript())
    .pipe(gulp.dest("dist/desktop/"));
});

const b = watchify(
  browserify({
    entries: ["src/client/app.tsx"],
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    cache: {},
    packageCache: {},
    debug: false,
    sourceMaps: false,
    fullPaths: true
  })
);

b.exclude(excludeModules);

b.transform(tsxify)
b.transform(sucrasify)
b.transform(
  babelify.configure({
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    plugins: [
      ["@babel/plugin-syntax-typescript"],
      ["@babel/plugin-syntax-decorators", { legacy: true }],
      ["@babel/plugin-syntax-jsx"],
      [
        "module-resolver",
        {
          root: ["."],
          alias: { "@coglite": "./packages" } //"underscore": "lodash"
        }
      ],
      "react-hot-loader/babel"
    ],
    sourceMaps: false
  })
);
//b.transform(require("browserify-postcss"), POSTCSS_HOT_CONFIG);
//b.plugin(reactHMR, { host: "localhost", port: 1337 });

b.plugin(reactHMR, { host: "localhost"});
b.on("error", console.log);
b.on("syntax", console.log);

function _launch() {
  console.log("launching electron");
  console.log(`BUNDLE SIZE: ${getFileSize(PATHS.OUT_FILE)}`);
  const child = spawn(electron, ["dist/desktop/main.js"], {
    detached: false,
    stdio: "inherit"
  });
  child.on("close", () => {
    console.log("electron is done");
    process.exit(0);
  });
}

const launch = _.once(_launch);

b.on("update", bundle);

async function bundle() {
  b.bundle()
    .on("error", console.error)
    .pipe(fs.createWriteStream(PATHS.OUT_FILE))
    .on("close", launch);
    //console.log(`wrote ${PATHS.OUT_FILE}`);
}

gulp.task("pug", function() {
  return gulp
    .src("src/client/**/*.pug")
    .pipe(pug())
    .pipe(gulp.dest(PATHS.OUT_DIR))
    .pipe(livereload());
});

gulp.task("app:postcss", () => {
  var stylusStream = gulp
    .src(["src/**/*.styl"])
    .pipe(concat("stylus-temp.styl"))
    .pipe(stylus())
    .pipe(postcss());

  var lessStream = gulp
    .src(["src/**/*.less"])
    .pipe(concat("less-temp.less"))
    .pipe(less())
    .pipe(postcss());

  var scssStream = gulp
    .src(["src/**/*.scss", "src/**/*.sass"])
    .pipe(sass({ outputStyle: "compressed" }))
    .on("error", sass.logError)
    .pipe(postcss());

  var cssStream = gulp.src("./src/**/*.css").pipe(postcss());

  return merge(stylusStream, lessStream, scssStream, cssStream)
    .pipe(concat("styles.min.css"))
    .pipe(postcss())
    .pipe(gulp.dest("dist/client"))
    .pipe(livereload());
});

gulp.task("transpile:parallel", gulp.parallel("app:postcss", "pug", "tsc:desktop"))

gulp.task("watch", async () => {
  livereload.listen();
  gulp.watch("src/**/*.pug", gulp.series("pug"));
  gulp.watch(PATHS.STYLES, gulp.series("app:postcss"));
});

gulp.task(
  "start",
  gulp.series(
    "clean:dist",
    //"tsc:desktop",
    //"pug",
    //"app:postcss",
    "transpile:parallel",
    bundle,
    "watch"
  )
);
