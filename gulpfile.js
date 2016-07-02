/* === PLUGINS === */
var gulp = require('gulp'),
    gutil = require('gulp-util'),
    rimraf = require('gulp-rimraf'),
    fs = require('fs'),
    path = require('path'),
    eslint = require('gulp-eslint'),
    sonar = require('gulp-sonar'),
    jsdoc = require('gulp-jsdoc3'),
    webpack = require('webpack'),
    _ = require('underscore');

var Karma = require('karma'),
    WebpackDevServer = require('webpack-dev-server');

/* === CONFIG === */
var pkgCfg = require('./webpack.config.pkg'),
    devCfg = require('./webpack.config.dev');

var SRC_QUALITY = ['src/**/*.js', '!node_modules/**'];

/* === TASKS === */
gulp.task('clean', function () {
    return gulp.src([pkgCfg[0].output.path, './build'], {read: false})
        .pipe(rimraf());
});

gulp.task('test', ['clean'], function (callback) {
    new Karma.Server({
        configFile: path.join(__dirname, '/karma.config.js'),
        singleRun: true
    }, callback).start();
});

gulp.task('lint', function () {
    return gulp.src(SRC_QUALITY)
        .pipe(eslint())
        .pipe(eslint.format('stylish'))
        .pipe(eslint.failAfterError());
});

gulp.task('sonar', function () {
    var sonarConfig = require('./sonar.config.js');
    sonarConfig.sonar.javascript = _.defaults({
            lcov: {
                reportPath: 'build/coverage/report-lcov/lcov.info'
            }
        },
        sonarConfig.sonar.javascript);
    return gulp.src(SRC_QUALITY, {read: false})
        .pipe(sonar(sonarConfig))
        .on('error', gutil.log);
});

gulp.task('jsdoc', ['clean'], function (callback) {
    gulp.src(['README.adoc', './src/**/*.js'], {read: false})
        .pipe(jsdoc(require('./jsdoc.config.json'), callback));
});

gulp.task('build', ['clean'], function (callback) {
    webpack(pkgCfg, function (err, stats) {
        if (err) {
            throw new gutil.PluginError('webpack', err);
        }
        gutil.log('[webpack]', stats.toString({
            colors: true
        }));
        callback();
    });
});

gulp.task('webserver-dev', function () {
    // Start the server
    new WebpackDevServer(webpack(devCfg), {
        publicPath: devCfg.output.publicPath,
        stats: {
            colors: true
        }
    }).listen(8080, 'localhost', function (err) {
        if (err) {
            throw new gutil.PluginError('webpack-dev-server', err);
        }
    });
});

gulp.task('default', ['build']);

gulp.task('ci', ['build', 'lint', 'test']);
