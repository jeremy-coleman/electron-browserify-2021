var _ = require("lodash")
var umd = require("umd")
var through = require("through2")
var crc = require("./crc")
var {readFileSync} = require("fs")
var {resolve} = require("path")
var convertSourceMaps = require("convert-source-map")
var offsetSourceMaps = require("./offset-sourcemap-lines")
var {startServer} = require("./server")

var loader = require("./reloading")


function leftPad1(str, len, ch) {
  str = String(str)
  var i = -1
  if (!ch && ch !== 0) ch = ' '
  len = len - str.length
  while (++i < len) {
    str = ch + str
  }
  return str
}

function leftPad(str, len, ch) {
  return String(str).padStart(len, ch)
}

function LiveReactloadPlugin(b, opts = {}) {
  const {
    port = 4474,
    //host = null,
    host = "localhost",
    babel = true,
    client = true,
    dedupe = true,
    debug = false,
    basedir = process.cwd(),
    'ssl-cert': sslCert = null,
    'ssl-key': sslKey = null,
  } = opts

  // server is alive as long as watchify is running
  const server = opts.server !== false ? startServer({ port: Number(port), sslCert, sslKey }) : null

  let clientRequires = []
  try {
    const RHLPatchModule = 'react-hot-loader/patch'
    require.resolve(RHLPatchModule)
    clientRequires.push(RHLPatchModule)
  } catch (e) {}

  const clientOpts = {
    // assuming that livereload package is in global mdule directory (node_modules)
    // and this file is in ./lib/babel-plugin folder
    //nodeModulesRoot: resolve(__dirname, '../../..'),
    nodeModulesRoot: resolve(process.cwd(), "node_modules"),
    port: Number(port),
    host: host,
    clientEnabled: client,
    debug: debug,
    babel: babel,
    clientRequires: clientRequires,
  }

  clientRequires.forEach((file) => b.require(file, opts))

  b.on('reset', addHooks)
  addHooks()

  function addHooks() {
    // this cache object is preserved over single bundling
    // pipeline so when next bundling occurs, this cache
    // object is thrown away
    const mappings = {},
      pathById = {},
      pathByIdx = {}
    const entries = []
    let standalone = null

    const idToPath = (id) => pathById[id] || (_.isString(id) && id) || throws('Full path not found for id: ' + id)

    const idxToPath = (idx) =>
      pathByIdx[idx] || (_.isString(idx) && idx) || throws('Full path not found for index: ' + idx)

    if (server) {
      b.pipeline.on('error', server.notifyBundleError)
    }

    b.pipeline.get('record').push(
      through.obj(function transform(row, enc, next) {
        const s = _.get(row, 'options._flags.standalone')
        if (s) {
          standalone = s
        }
        next(null, row)
      }),
    )

    b.pipeline.get('sort').push(
      through.obj(function transform(row, enc, next) {
        const { id, index, file } = row
        pathById[id] = file
        pathByIdx[index] = file
        next(null, row)
      }),
    )

    if (!dedupe) {
      b.pipeline.splice('dedupe', 1, through.obj())
      if (b.pipeline.get('dedupe')) {
        log('Other plugins have added de-duplicate transformations. --no-dedupe is not effective')
      }
    } else {
      b.pipeline.splice(
        'dedupe',
        0,
        through.obj(function transform(row, enc, next) {
          const cloned = _.extend({}, row)
          if (row.dedupeIndex) {
            cloned.dedupeIndex = idxToPath(row.dedupeIndex)
          }
          if (row.dedupe) {
            cloned.dedupe = idToPath(row.dedupe)
          }
          next(null, cloned)
        }),
      )
    }

    b.pipeline.get('label').push(
      through.obj(
        function transform(row, enc, next) {
          const { id, file, source, deps, entry } = row
          const converter = convertSourceMaps.fromSource(source)
          let sourceWithoutMaps = source
          let adjustedSourcemap = ''
          let hash

          if (converter) {
            const sources = converter.getProperty('sources') || []
            sourceWithoutMaps = convertSourceMaps.removeComments(source)
            hash = getHash(sourceWithoutMaps)
            converter.setProperty(
              'sources',
              sources.map((source) => (source += '?version=' + hash)),
            )
            adjustedSourcemap = convertSourceMaps.fromObject(offsetSourceMaps(converter.toObject(), 1)).toComment()
          } else {
            hash = getHash(source)
          }

          if (entry) {
            entries.push(file)
          }
          mappings[file] = [
            sourceWithoutMaps,
            deps,
            { id: file, hash: hash, browserifyId: id, sourcemap: adjustedSourcemap },
          ]
          next(null, row)
        },
        function flush(next) {
          next()
        },
      ),
    )

    b.pipeline.get('wrap').push(
      through.obj(
        function transform(row, enc, next) {
          next(null)
        },
        function flush(next) {
          const pathById = _.fromPairs(_.toPairs(mappings).map(([file, [s, d, { browserifyId: id }]]) => [id, file]))
          const idToPath = (id) => pathById[id] || (_.isString(id) && id)

          const depsToPaths = (deps) =>
            _.reduce(
              deps,
              (m, v, k) => {
                let id = idToPath(v)
                if (id) {
                  m[k] = id
                }
                return m
              },
              {},
            )

          const withFixedDepsIds = _.mapValues(mappings, ([src, deps, meta]) => [src, depsToPaths(deps), meta])
          const args = [withFixedDepsIds, entries, clientOpts]
          let bundleSrc = `(${loader.toString()})(${args.map((a) => JSON.stringify(a, null, 2)).join(', ')});`
          if (standalone) {
            bundleSrc = umd(standalone, `return ${bundleSrc}`)
          }

          this.push(Buffer.from(bundleSrc, 'utf8'))
          if (server) {
            server.notifyReload(withFixedDepsIds)
          }
          next()
        },
      ),
    )
  }

  function throws(msg) {
    throw new Error(msg)
  }

  function getHash(data) {
    const crcHash = leftPad(crc.crc32(data).toString(16), 8, '0')
    return Buffer.from(crcHash, 'hex').toString('base64').replace(/=/g, '')
  }
}

module.exports = LiveReactloadPlugin
