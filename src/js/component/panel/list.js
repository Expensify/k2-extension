import React from 'react';
import Title from '../panel-title/Title';

/**
 * Panel - List variant
 *
 * This panel contains a title and a list of items.
 *
 * @param {array} list the data that will be displayed in the list
 * @param {string} item the type of item that will be displayed in the list
 *                      will correspond to something in component/list-item
 * @param {object} options various options passed to the list as well
 * @param {string} extraClass gets appended to the panels class for styling purposes
 */

const List = require('../list/index');

module.exports = React.createClass({
    fetched: false,
    componentDidMount() {
        if (!this.fetched) {
            this.fetch();
        }
        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
    },

    componentDidUpdate() {
        if (!this.fetched) {
            this.fetch();
        }
        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
    },

    componentWillUnmount() {
        clearInterval(this.interval);
    },

    fetch() {
        this.list.fetch();
    },

    getPanelClass() {
        return `panel ${this.props.extraClass}`;
    },

    render() {
        return (
            <div className={this.getPanelClass()}>
                <Title text={this.props.title} />
                <List
                    ref={el => this.list = el}
                    type={this.props.item}
                    options={this.props.options}
                    action={this.props.action}
                    store={this.props.store}
                    data={this.props.list}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...this.props.listOptions}
                />
                {this.props.children}
            </div>
        );
    },
});
