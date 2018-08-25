import {PATHS} from '../paths'

export let BROWSERIFY_BASE_CONFIG =
{
  entries: [PATHS.client.src],
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  cache: {},
  packageCache: {},
  debug: false,
  sourceMaps: false,
  fullPaths: true
}

export let BROWSERIFY_HMR_CONFIG =
{
    entries: [PATHS.client.src],
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    debug:        true,
    cache:        {},
    packageCache: {},
    fullPaths:    true
}