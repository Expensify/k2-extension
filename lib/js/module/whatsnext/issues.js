
const React = require('react');
const _ = require('underscore');

const Issue = require('./issue');

module.exports = React.createClass({
    propTypes() {
        return {
            // A list of issues to show
            data: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,

            // A callback that is triggered when we click the move up button
            onMoveIssueUp: React.PropTypes.func,

            // A callback that is triggered when we click the move down button
            onMoveIssueDown: React.PropTypes.func,
        };
    },

    render() {
        if (!this.props.data || !this.props.data.length) {
            return <ul><li className="Box-row">No Items</li></ul>;
        }
        return (
            <ul>
                {_.map(this.props.data, issue => (
                    <Issue
                        data={issue}
                        key={issue.id}
                        onMoveUp={() => this.props.onMoveIssueUp(issue.id)}
                        onMoveDown={() => this.props.onMoveIssueDown(issue.id)}
                    />
                ))}
            </ul>
        );
    },
});
