'use strict';

var gulp = require('gulp');
var plumber = require('gulp-plumber');
var zip = require('gulp-zip');

module.exports = function(options) {
  return function() {
      return gulp.src('dist/**/*')
        .pipe(plumber({
          errorHandler: require('../error.beep')
        }))
        .pipe(zip('dist.zip'))
        .pipe(gulp.dest('.'));
  };
}
