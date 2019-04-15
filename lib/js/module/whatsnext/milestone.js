'use strict';

const React = require('react');

const Issues = require('./issues');

module.exports = React.createClass({
  propTypes() {
    return {
      data: React.PropTypes.shapeOf({
        // The ID of the milestone
        id: React.PropTypes.string.isRequired,
        // The title of the milestone
        title: React.PropTypes.string.isRequired,
        // The percentage of completion for the milestone
        percentComplete: React.PropTypes.number.isRequired,
        // How many open issues the milestone has
        open_issues: React.PropTypes.number.isRequired,
        // How many closed issues the milestone has
        closed_issues: React.PropTypes.number.isRequired,
        // Whether or not the milestone has been hidden
        hidden: React.PropTypes.bool,
        // An array of issues for this milestone
        issues: React.PropTypes.arrayOf(React.PropTypes.object)
      }).isRequired,
      onHide: React.PropTypes.func,
      onShow: React.PropTypes.func,
      onMoveUp: React.PropTypes.func,
      onMoveDown: React.PropTypes.func,
      // A callback that is triggered when we click the move up button
      onMoveIssueUp: React.PropTypes.func,
      // A callback that is triggered when we click the move down button
      onMoveIssueDown: React.PropTypes.func,
      loading: React.PropTypes.bool
    };
  },

  getInitialState() {
    return {
      currentView: null,
      error: null
    };
  },

  render() {
    if (this.props.data.hidden) {
      return (
        <li className="Box-row">
          <a href={this.props.data.html_url} target="_blank">{this.props.data.title} - {this.props.data.percentComplete}%{' '}</a>
          <button className="btn-link float-right" onClick={() => this.props.onShow(this.props.data.id)}>Show</button>
        </li>
      );
    }

    return (
      <div className="milestone">
        <div className="table-list-header">
          <div className="table-list-filters">
            <div className="table-list-header-toggle float-left">
              <div className="table-list-header-meta">
                <a href={this.props.data.html_url} target="_blank">{this.props.data.title}</a>
              </div>
            </div>

            <div className="table-list-header-toggle float-right">
              <button className="btn-link" onClick={() => this.props.onHide(this.props.data.id)}>
                Hide
              </button>
              <button className="btn-link" onClick={() => this.props.onMoveUp(this.props.data.id)}>▲</button>
              <button className="btn-link" onClick={() => this.props.onMoveDown(this.props.data.id)}>▼</button>
            </div>
          </div>
        </div>

        <div className="border-right border-bottom border-left">

          {this.state.error && <div>There was an error: {this.state.error}</div>}

          <ul>
            <li className="Box-row">

              {this.props.data.description && <p>
                {this.props.data.description}
              </p>}
              <span className="progress-bar progress-bar-small">
                <span className="progress" style={{width: this.props.data.percentComplete + '%'}}>{' '}</span>
              </span>
              Progress: {this.props.data.percentComplete}%{' '}
              Open: {this.props.data.open_issues}{' '}
              Closed: {this.props.data.closed_issues}

            </li>

            {this.state.error && <li>There was an error: {this.state.error}</li>}
          </ul>

          {this.props.loading && <ul>
            <li className="Box-row">Loading...</li>
          </ul>}

          {!this.props.loading &&
            <Issues
              data={this.props.data.issues}
              onMoveIssueUp={this.props.onMoveIssueUp}
              onMoveIssueDown={this.props.onMoveIssueDown}
            />
          }
        </div>
      </div>
    );
  }
});
