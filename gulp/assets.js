'use strict';

module.exports = {
  clientJs: [
    __dirname + '/../lib/js/**/*.js',
    '!' + __dirname + '/../lib/js/**/_*.js'
  ],
  clientJsx: [
    __dirname + '/../lib/js/**/*.jsx'
  ],
  clientTemplates: [
    __dirname + '/../lib/js/**/*.html'
  ],
  clientImages: [
    __dirname + '/../lib/images/**/*'
  ],
  clientJsApps: [
    __dirname + '/../lib/js/menu.js',
    __dirname + '/../lib/js/content.js',
    __dirname + '/../lib/js/events.js'
  ],
  clientSass: [
    __dirname + '/../lib/css/**/*.scss'
  ],
  clientHtml: [
    __dirname + '/../lib/*.html'
  ],
  manifest: [
    __dirname + '/../manifest.json'
  ]
};
