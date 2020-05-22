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

const MilestoneViews = require('./milestone.views');

module.exports = function() {
  return {
    draw: function() {
      // Make sure they have entered their password
      prefs.get('ghToken', function() {
        $('.repository-content').children().remove();
        if (!$('.repository-content').children('.whatsnext').length) {
          $('.repository-content').append('<div class="whatsnext">');
        }
        ReactDOM.render(
          <MilestoneViews />,
          $('.whatsnext').show()[0]
        );
      });
    }
  };
};
