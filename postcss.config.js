var purgecss = require('@fullhuman/postcss-purgecss')

module.exports = {
    plugins: [
             require('postcss-omit-import-tilde')(),
             require('postcss-easy-import')(),
             require("postcss-url")(({url: 'inline'})),
             //require("postcss-url")(({url: 'rebase'})),
             require('postcss-preset-env')({ browsers: 'last 2 Chrome versions' }),
             require('postcss-inline-svg')(),
             require('postcss-svgo')(),
             purgecss({
                    content: [
                      'src/**/*.html',
                      'src/**/*.hbs',
                      'src/**/*.tsx',
                      'src/**/*.ts',
                      'src/**/*.js',
                      'src/**/*.jsx'
                    ]
             }),
             require('postcss-csso')({ restructure: true }),
             require('postcss-discard-duplicates'),
    ]
};


// --- postcss url options --
//1
//require('postcss-url')({url: 'copy', basePath: 'src/client', assetsPath: path.join(__dirname, 'dist/client/assets')}),
//
//2
// const options = [
//     { filter: '**/assets/copy/*.png', url: 'copy', assetsPath: 'img', useHash: true },
//     { filter: '**/assets/inline/*.svg', url: 'inline' },
//     { filter: '**/assets/**/*.gif', url: 'rebase' },
//     // using custom function to build url
//     { filter: 'cdn/**/*', url: (asset) => `https://cdn.url/${asset.url}` }
// ];

// postcss().use(url(options))