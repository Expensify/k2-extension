'use strict';

var gulp = require('gulp');

module.exports = function(options) {
  return function() {
    gulp.src( require('../assets').manifest )
      .pipe(gulp.dest(__dirname + '/../../dist'));
  };
};
