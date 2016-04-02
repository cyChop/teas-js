const path = require('path'),
    autoprefixer = require('autoprefixer');

module.exports = {
    entry: {
        beverages: path.join(__dirname, '/src/main/js/beverages.js')
    },
    output: {
        path: path.join(__dirname, '/dist/'),
        filename: '[name].bundle.js',
        chunkFilename: "[id].chunk.js"
    },
    module: {
        loaders: [
            {test: /backbone/, loader: 'exports?Backbone!imports?underscore,jquery'},

            {test: /bootstrap((\/|\\)dist)(\/|\\)js/, loader: 'imports?jQuery=jquery'},
            //{test: /bootstrap\/.*tooltip\.js/, loader: 'expose?Tether!imports?tether'},

            {test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url?mimetype=application/font-woff'},
            {test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file?prefix=font/'},

            {test: /\.scss/, loader: 'style!css!postcss!resolve-url!sass?sourceMap'}
        ]
    },
    postcss: function () {
        return [autoprefixer];
    },
    resolve: {
        root: [path.join(__dirname, './node_modules')],
        alias: {
            'rivets-cfg': path.join(__dirname, '/src/main/js/lib/rivets-cfg.js')
        }
    }
};
