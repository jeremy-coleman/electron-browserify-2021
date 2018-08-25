export let BABEL_PROD_CONFIG =
{
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        plugins: [
            ["@babel/plugin-syntax-typescript"],
            ["@babel/plugin-syntax-decorators", {"legacy": true}],
            ["@babel/plugin-syntax-jsx"],
            ["module-resolver", {
              "root": ["."],
              "alias": {"@coglite": "./packages"} //"underscore": "lodash"
            }]
        ],
        sourceMaps: false
}