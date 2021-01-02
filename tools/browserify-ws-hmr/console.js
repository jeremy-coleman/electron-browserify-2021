
//var clc = require("cli-color")

var clc = require("kolorist")

function log(msg, ...data) {
  const t = /T([0-9:.]+)Z/g.exec(new Date().toISOString())[1]
  console.log(
    clc.green(`[${t}] HMR`),
    "::",
    clc.cyan(msg)
  )
  data.forEach(d => console.log(clc.yellow("  >"), clc.yellow(d)))
}

module.exports = {log}