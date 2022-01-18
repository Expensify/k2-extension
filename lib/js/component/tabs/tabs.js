'use strict';

/**
 * A component for tabs to show the selected tab and the corresponding content
 */

let React = require('react');
const _ = require('underscore');
const Contents = require('./contents');

module.exports = React.createClass({
  getInitialState() {
    return {
      items: this.props.items
    };
  },

  componentDidMount() {
    let foundActiveTab = false;

    // Set the currently selected tab based on our hash
    _.each(this.state.items, i => {
      if (localStorage.activeTab === i.id) {
        this.setActive(i.id);
        foundActiveTab = true;
      }
    });

    // Select the web tab by default, because I'm selfish
    if (!foundActiveTab) {
      this.setActive('web');
    }
  },

  /**
   * Set a tab to active
   * @param {String} id of the tab to activate
   */
  setActive(id) {
    localStorage.activeTab = id;
    this.setState({items: _(this.state.items).each(i => {
      i.selected = i.id === id ? 'selected' : '';
    })});
  },

  /**
   * Refreshes our data with the given filters
   * @public
   * @param {Object} filters
   */
  refreshWithFilters(filters) {
    if (this.contents) {
      this.contents.refreshWithFilters(filters);
    }
  },

  render: function() {
    let selectedItem = _(this.state.items).findWhere({selected: 'selected'});

    return (
      <div>
        <nav className="hx_reponav reponav js-repo-nav js-sidenav-container-pjax" role="navigation" data-pjax="#js-repo-pjax-container">
          {_(this.state.items).map(i => (
            <a
              key={_.uniqueId()}
              data-key={i.apiMethod}
              className={`reponav-item ${i.selected}`}
              onClick={e => {
                e.preventDefault();
                this.setActive(i.id);
              }}
            >
              {' '}{i.title}{' '}<span className="Counter">-</span>
            </a>
          ))}
        </nav>
        {selectedItem ? <Contents ref={el => this.contents = el} {...selectedItem} type={this.props.type} pollInterval={this.props.pollInterval} /> : null}
      </div>
    );
  }
});
