const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {IgnorePlugin} = require('webpack');

module.exports = {
    context: path.resolve(__dirname, '.'),
    entry: {
        content: './src/js/content.js',
        events: './src/js/events.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.jsx', '.js'],
    },

    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin(),

        // This is necessary because when moment.js is imported, it require()s some locale files which aren't needed and this results
        // in console errors. By ignoring those imports, it allows everything to work without errors. More can be read about this here:
        // https://webpack.js.org/plugins/ignore-plugin/#example-of-ignoring-moment-locales
        new IgnorePlugin({
            resourceRegExp: /^\.\/locale$/,
        }),

        // Copies icons and manifest file into our dist folder
        new CopyPlugin({
            patterns: [
                {from: './assets/', to: path.resolve(__dirname, 'dist')}
            ]
        }),
    ],

    module: {
        rules: [
            // Load .html files as strings, used for underscore templates
            {
                test: /\.html$/i,
                use: 'underscore-template-loader'
            },

            // Transpiles ES6 and JSX
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                },

                /**
                 * Exclude node_modules except two packages we need to convert for rendering HTML because they import
                 * "react-native" internally and use JSX which we need to convert to JS for the browser.
                 *
                 * You can remove something from this list if it doesn't use JSX/JS that needs to be transformed by babel.
                 */
                include: [
                    path.resolve(__dirname, 'src'),
                    path.resolve(__dirname, 'node_modules/react-native-onyx'),
                ],
                exclude: [
                    path.resolve(__dirname, 'node_modules/react-native-onyx/node_modules'),
                ],
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Outputs the generated CSS to the dist folder
                    MiniCssExtractPlugin.loader,

                    // Translates CSS into CommonJS
                    'css-loader',

                    // Compiles Sass to CSS
                    'sass-loader',
                ],
            },
            {
                test: /\.js$/,
                loader: 'eslint-loader',
                exclude: [
                    path.resolve(__dirname, 'node_modules'),
                ],
                options: {
                    cache: false,
                    emitWarning: true,
                    configFile: path.resolve(__dirname, '.eslintrc.js'),
                },
            },
        ]
    },
};
