const path = require('path');

const webpackConfig = {
  entry: {
    content: path.resolve(__dirname, './lib/js/content.js'),
    events: path.resolve(__dirname, './lib/js/events.js')
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../../dist'),
    publicPath: '/',
  },
};

module.exports = webpackConfig;
