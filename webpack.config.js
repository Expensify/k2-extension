const path = require('path');

const webpackConfig = {
  entry: {
    app: './index.js',
  },
  output: {
    filename: '[name]-[hash].bundle.js',
    path: path.resolve(__dirname, '../../dist'),
    publicPath: '/',
  },
};

module.exports = webpackConfig;
