'use strict';

/**
 * What's Next
 *
 * Displays some of our milestones and the open issues in them
 */

const $ = require('jquery');
const prefs = require('../../lib/prefs');
const React = require('react');
const ReactDOM = require('react-dom');

const Milestones = require('./milestones');

module.exports = function() {
  return {
    draw: function() {
      // Make sure they have entered their password
      prefs.get('ghPassword', function(ghPassword) {
        $('.repository-content').children().hide();
        if (!$('.repository-content').children('.whatsnext').length) {
          $('.repository-content').append('<div class="whatsnext">');
        }
        ReactDOM.render(
          <Milestones />,
          $('.whatsnext').show()[0]
        );
      });
    }
  };
};
