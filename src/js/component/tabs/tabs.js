import React from 'react';
import _ from 'underscore';
import Contents from './Contents';

/**
 * A component for tabs to show the selected tab and the corresponding content
 */
export default React.createClass({
    getInitialState() {
        return {
            items: this.props.items,
        };
    },

    componentDidMount() {
        let foundActiveTab = false;

        // Set the currently selected tab based on our hash
        _.each(this.state.items, (i) => {
            if (localStorage.activeTab !== i.id) {
                return;
            }
            this.setActive(i.id);
            foundActiveTab = true;
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
        this.setState({
            items: _.map(this.state.items, item => ({...item, selected: item.id === id ? 'selected' : ''})),
        });
    },

    /**
     * Refreshes our data with the given filters
     * @public
     * @param {Object} filters
     */
    refreshWithFilters(filters) {
        if (!this.contents) {
            return;
        }

        this.contents.refreshWithFilters(filters);
    },

    render() {
        const selectedItem = _.findWhere(this.state.items, {selected: 'selected'});

        return (
            <div>
                <nav className="hx_reponav reponav js-repo-nav js-sidenav-container-pjax" role="navigation" data-pjax="#js-repo-pjax-container">
                    {_.map(this.state.items, i => (
                        // eslint-disable-next-line jsx-a11y/anchor-is-valid,jsx-a11y/interactive-supports-focus
                        <a
                            key={_.uniqueId()}
                            data-key={i.apiMethod}
                            className={`reponav-item ${i.selected}`}
                            onClick={(e) => {
                                e.preventDefault();
                                this.setActive(i.id);
                            }}
                            role="button"
                        >
                            {' '}
                            {i.title}
                            {' '}
                            <span className="Counter">-</span>
                        </a>
                    ))}
                </nav>
                {/* eslint-disable-next-line react/jsx-props-no-spreading */}
                {selectedItem ? <Contents ref={el => this.contents = el} {...selectedItem} type={this.props.type} pollInterval={this.props.pollInterval} /> : null}
            </div>
        );
    },
});
