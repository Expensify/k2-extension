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
    children: PropTypes.element.isRequired,

    ...listPropTypes,
};

const defaultProps = {
    pollInterval: null,
    extraClass: '',
};

class PanelList extends React.Component {
    constructor(props) {
        super(props);
        this.fetched = false;
    }

    componentDidMount() {
        if (!this.fetched) {
            this.fetch();
        }
        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
    }

    componentDidUpdate() {
        if (!this.fetched) {
            this.fetch();
        }
        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
    }

    componentWillUnmount() {
        clearInterval(this.interval);
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
