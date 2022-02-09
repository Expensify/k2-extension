
/**
 * What's Next
 *
 * Displays some of our milestones and the open issues in them
 */

const $ = require('jquery');
const React = require('react');
const ReactDOM = require('react-dom');
const prefs = require('../../lib/prefs');

const MilestoneViews = require('./milestone.views');

module.exports = function () {
    return {
        draw() {
            // Make sure they have entered their API token
            prefs.get('ghToken', () => {
                $('.repository-content').children().remove();
                if (!$('.repository-content').children('.whatsnext').length) {
                    $('.repository-content').append('<div class="whatsnext">');
                }
                ReactDOM.render(
                    <MilestoneViews />,
                    $('.whatsnext').show()[0],
                );
            });
        },
    };
};
