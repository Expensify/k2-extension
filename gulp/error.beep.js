'use strict';

module.exports = function(err) {
  console.error(err.stack || (err.message + ' ' + err.fileName + ':' + err.lineNumber));
  console.error('\u0007');
  this.emit('end');
};
