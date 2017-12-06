'use strict';

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var gulpIf = require('gulp-if');
var plumber = require('gulp-plumber');

function isFixed(file) {
  // Has ESLint fixed the file contents?
  return file.eslint !== null && file.eslint.fixed;
}

module.exports = function(options) {
  return function() {
    return gulp.src(require('../assets').clientJs)
      .pipe(plumber({
        errorHandler: require('../error.beep')
      }))
      .pipe(eslint({
        useEslintrc: true,
        fix: true,
        configFile: '.eslintrc'
      }))
      .pipe(eslint.format())
      // if fixed, write the file to dest
      .pipe(gulpIf(isFixed, gulp.dest(__dirname + '/../../lib/js')))
      .pipe(eslint.failOnError());
  };
}
