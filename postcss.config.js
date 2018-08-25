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
             require('postcss-font-smoothing')(),
             purgecss({
                    content: [
                      'src/**/*.html',
                      'src/**/*.tsx',
                      'src/**/*.ts',
                      'src/**/*.hbs',
                      'src/**/*.js']
             }),
             require('postcss-csso')({ restructure: true }),
             require('postcss-discard-duplicates'),
    ]
};