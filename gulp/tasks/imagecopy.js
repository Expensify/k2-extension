'use strict';

var gulp = require('gulp');

module.exports = function(options) {
  return function() {
    gulp.src( require('../assets').clientImages )
      .pipe(gulp.dest(__dirname + '/../../dist'));
  };
};
