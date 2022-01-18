const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

const webpackConfig = {
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

    // Copies favicons into the dist/ folder to use for unread status
    new CopyPlugin({
      patterns: [
        {from: './assets/'},
      ],
    }),
  ],

  module: {
    rules: [
      // Load .html files as strings, used for underscore templates
      {
        test: /\.html$/i,
        use: 'html-loader'
      },
      // Transpiles and lints all the JS
      {
        test: /\.js$/i,
        use: 'babel-loader',
      }
    ]
  }
};

module.exports = webpackConfig;
