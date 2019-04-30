'use strict';

var gulp = require('gulp');
var gulpCopy = require('gulp-copy');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var importCss = require('gulp-import-css');

module.exports = function(options) {
  return function() {
    return gulp.src(require('../assets').clientSass)
      .pipe(plumber({
        errorHandler: require('../error.beep')
      }))
      .pipe(sass())
      .pipe(importCss())
      .pipe(gulp.dest(__dirname + '/../../dist/css'));
  };
};
