'use strict';
var gulp = require('gulp');

module.exports = function(tasks, options) {
  options = options || {};

  tasks.forEach(function(name) {
    gulp.task(name, require('./tasks/' + name)(options));
  });

  return gulp;
};
