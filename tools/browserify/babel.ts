export let BABEL_HOT_CONFIG =
{
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        plugins: [
            ["@babel/plugin-syntax-typescript"],
            ["@babel/plugin-syntax-decorators", {"legacy": true}],
            ["@babel/plugin-syntax-jsx"],
            ["module-resolver", {
              "root": ["."],
              "alias": {"@coglite": "./packages"} //"underscore": "lodash"
            }],
            "react-hot-loader/babel"
        ],
        sourceMaps: false
  }
  
  