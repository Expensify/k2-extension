import React from 'react';
import PropTypes from 'prop-types';
import Title from '../panel-title/Title';
import List from '../list/List';
import listPropTypes from '../list/listPropTypes';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number,

    /** And extra CSS class to apply to the panel container */
    extraClass: PropTypes.string,

    /** The title of the panel to be displayed */
    title: PropTypes.string.isRequired,

    /** Elements to display inside the panel */
    children: PropTypes.node,

    ...listPropTypes,
};

const defaultProps = {
    children: null,
    extraClass: '',
    pollInterval: null,
};

class PanelList extends React.Component {
    constructor(props) {
        super(props);

        this.fetch = this.fetch.bind(this);

        this.fetched = false;
    }

    componentDidMount() {
        this.setupFetchAndRefreshInterval();
    }

    componentDidUpdate() {
        this.setupFetchAndRefreshInterval();
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    setupFetchAndRefreshInterval() {
        if (!this.fetched) {
            this.fetch();
        }
        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
    }

    getPanelClass() {
        return `panel ${this.props.extraClass}`;
    }

    fetch() {
        this.list.fetch();
    }

    render() {
        return (
            <div className={this.getPanelClass()}>
                <Title text={this.props.title} />
                <List
                    ref={el => this.list = el}
                    type={this.props.item}
                    action={this.props.action}
                    store={this.props.store}
                    data={this.props.list}
                />
                {this.props.children}
            </div>
        );
    }
}

PanelList.propTypes = propTypes;
PanelList.defaultProps = defaultProps;

export default PanelList;
