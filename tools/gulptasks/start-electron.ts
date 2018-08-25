var electron = require('electron')
var cp = require('child_process')
var gulp = require('gulp')


gulp.task('start:electron', async () => {
   cp.spawn(electron, ["."], { stdio: "inherit" })
      .on("close", () => {
        process.exit(0)
      })
  })
  
export async function startElectron() {
  return cp.spawn(electron, ["."], { stdio: "inherit" })
      .on("close", () => {
        process.exit(0)
      })
}