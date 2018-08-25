import {PATHS} from '../paths'

export let POSTCSS_HOT_CONFIG =
{
    plugin: [
    //'postcss-import',
    'postcss-easy-import',
    'postcss-advanced-variables',
    ['postcss-custom-url', [
      ['inline', { maxSize: 10 }],
      ['copy', {
        assetOutFolder: __dirname + PATHS.client.dest + 'assets',
        baseUrl: 'assets',
        name: '[name].[hash]',
      }],
    ]
   ],
      
   ['postcss-preset-env', { browsers: 'last 2 Chrome versions' }],
     'postcss-inline-svg',
     'postcss-svgo',
    ['@fullhuman/postcss-purgecss', 
      //{content: ['src/app/**/*.html', 'src/app/**/*.tsx', 'src/app/**/*.ts', 'src/app/**/*.js']}
      {content: ['src/**/*.html', 'src/**/*.tsx', 'src/**/*.ts', 'src/**/*.js']}
   ],
   'postcss-discard-duplicates',
   ['postcss-csso', { restructure: false }]
  ],
  basedir: __dirname + '/src/client',
  inject: true
}

export let POSTCSS_BASE_CONFIG =
{
    plugin: [
    'postcss-easy-import',
    'postcss-advanced-variables',
   ['postcss-preset-env', { browsers: 'last 2 Chrome versions' }],
     'postcss-inline-svg',
     'postcss-svgo',
    ['@fullhuman/postcss-purgecss', 
      {content: ['src/**/*.html', 'src/**/*.tsx', 'src/**/*.ts', 'src/**/*.js']}
   ],
   'postcss-discard-duplicates',
   ['postcss-csso', { restructure: false }]
  ],
  //basedir: __dirname + '/src/client',
  inject: false
}