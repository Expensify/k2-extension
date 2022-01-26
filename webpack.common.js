const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {IgnorePlugin} = require('webpack');

const webpackCommon = {
  context: path.resolve(__dirname, '.'),
  entry: {
    content: './lib/js/content.js',
    events: './lib/js/events.js'
  },
  mode: 'production',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },

  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin(),

    // This is necessary because when moment.js is imported, it require()s some locale files which aren't needed and this results
    // in console errors. By ignoring those imports, it allows everything to work without errors. More can be read about this here:
    // https://webpack.js.org/plugins/ignore-plugin/#example-of-ignoring-moment-locales
    new IgnorePlugin({
      resourceRegExp: /^\.\/locale$/
    }),

    // Copies icons and manifest file into our dist folder
    new CopyPlugin({
      patterns: [
        {from: './assets/'}
      ]
    }),

    // Lint all the JS code
    new ESLintPlugin({
      cache: false,
      emitWarning: true,
      overrideConfigFile: path.resolve(__dirname, '.eslintrc.js'),
      lintDirtyModulesOnly: true
    })
  ],

  module: {
    rules: [
      // Load .html files as strings, used for underscore templates
      {
        test: /\.html$/i,
        use: 'underscore-template-loader'
      },

      // Transpiles all the JS, including the react JSX
      {
        test: /\.js$/,
        use: 'babel-loader'
      },

      // Transpile all our SASS
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Outputs the generated CSS to the dist folder
          MiniCssExtractPlugin.loader,

          // Translates CSS into CommonJS so that it can be loaded in the JS files using import or require()
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
            },
          },

          // Compiles Sass to CSS
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ]
  }
};

module.exports = webpackCommon;
