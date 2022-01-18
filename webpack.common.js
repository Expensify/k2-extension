const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

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

    // Copies icons and manifest file into our dist folder
    new CopyPlugin({
      patterns: [
        {from: './assets/'}
      ]
    }),
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
        use: 'html-loader'
      },

      // Transpiles all the JS, including the react JSX
      {
        test: /\.js$/,
        use: 'babel-loader'
      },
    ]
  }
};

module.exports = webpackCommon;
