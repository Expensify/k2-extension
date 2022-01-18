const path = require('path');

const webpackConfig = {
  entry: {
    content: './lib/js/content.js',
    events: './lib/js/events.js'
  },
  devServer: {
    open: false
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './dist'),
    publicPath: './dist'
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader'
      },
      // Transpiles and lints all the JS
      {
        test: /\.js$/,
        loader: 'babel-loader'
      }
    ]
  }
};

module.exports = webpackConfig;
