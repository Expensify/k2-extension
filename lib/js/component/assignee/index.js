
const React = require('react');

module.exports = React.createClass({
    render() {
        return (
            <a className="assignee" href={this.props.data.html_url} target="_blank" rel="noreferrer">
                <span className="octicon octicon-person" />
                {this.props.data.login}
            </a>
        );
    },
});
