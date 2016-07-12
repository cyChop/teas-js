var webpackConfig = require('./webpack.config'),
    webpack = require('webpack'),
    merge = require('webpack-merge');

var LANGUAGES = ['fr', 'en'];

module.exports = LANGUAGES.map(function (lg) {
    return merge.smart(webpackConfig(lg), {
        module: {
            loaders: [
                {test: /\.html?$/, loader: 'raw!html-minify'}
            ]
        },
        plugins: [
            new webpack.optimize.UglifyJsPlugin()
        ]
    });
});
