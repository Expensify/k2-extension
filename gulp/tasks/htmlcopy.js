'use strict';

var gulp = require('gulp');
var gulpCopy = require('gulp-copy');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var importCss = require('gulp-import-css');

module.exports = function(options) {
  return function() {
    gulp.src(require('../assets').clientHtml)
      .pipe(gulp.dest(__dirname + '/../../dist'));
  };
};
