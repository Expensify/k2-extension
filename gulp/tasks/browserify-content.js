'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var gif = require('gulp-if');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var uglify = require('gulp-uglify');
var buffer = require('vinyl-buffer');
var plumber = require('gulp-plumber');
var babelify = require('babelify');
var reactify = require('reactify');

var clientJs = require('../assets').clientJs;
var clientJsApps = require('../assets').clientJsApps;
var clientTemplates = require('../assets').clientTemplates;
var allClientCode = clientJs.concat(clientTemplates);

// Change this to load the index of the proper client app
var clientJsApp = clientJsApps[1];

var appNameArray = clientJsApp.split('/');
var appName = appNameArray[appNameArray.length - 1];
var bundler = null;

module.exports = function(options) {
  return function bundle() {

    // we need to make sure this is only initialized once
    if (!bundler) {
      bundler = options.watchify ? watchify(browserify(watchify.args)) : browserify(watchify.args);

      // add the file to bundle
      bundler.add(clientJsApp);
      bundler.transform(reactify)
      bundler.transform(babelify, {presets: ['es2015', 'react']})
      bundler.on('update', bundle); // on any dep update, runs the bundler
      bundler.on('log', gutil.log); // output build logs to terminal
    }

    return bundler.bundle()
      // log errors if they happen
      .pipe(plumber({
        errorHandler: require('../error.beep')
      }))
      .pipe(source(appName))
      .pipe(buffer())
      .pipe(gif(options.uglify, uglify()))
      .pipe(gulp.dest(__dirname + '/../../dist/js'));
  };
};
