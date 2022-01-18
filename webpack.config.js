const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

const webpackConfig = {
  entry: {
    content: './lib/js/content.js',
    events: './lib/js/events.js'
  },
  mode: 'production',
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, './dist')
  },

  plugins: [
    new CleanWebpackPlugin(),
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

        /**
         * Exclude node_modules except two packages we need to convert for rendering HTML because they import
         * "react-native" internally and use JSX which we need to convert to JS for the browser.
         *
         * You can remove something from this list if it doesn't use JSX/JS that needs to be transformed by babel.
         */
        include: [
          path.resolve(__dirname, 'lib/js'),
        ],
      }
    ]
  }
};

module.exports = webpackConfig;
