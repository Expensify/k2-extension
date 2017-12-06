'use strict';

var gulp = require('gulp');
var react = require('gulp-react');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');

module.exports = function() {
  return function() {
    return gulp.src(require('../assets').clientJsx)
      .pipe(plumber({
        errorHandler: require('../error.beep')
      }))
      .pipe(sourcemaps.init())
      .pipe(react({
        quotmark: 'single'
      }))
      .pipe(rename({
        prefix: '_',
        extname: '.js'
      }))
      .pipe(gulp.dest('lib/js'));
  };
};
