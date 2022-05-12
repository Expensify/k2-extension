import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import PanelListRaw from '../../component/panel/PanelListRaw';

const propTypes = {
    /** The number of milliseconds to refresh the data */
    pollInterval: PropTypes.number.isRequired,

    /** The 'alt' store to get data from for this component */
    // eslint-disable-next-line react/forbid-prop-types
    store: PropTypes.object.isRequired,

    /** The 'alt' action for fetching data */
    // eslint-disable-next-line react/forbid-prop-types
    action: PropTypes.object.isRequired,
};

class ListIssuesAssigned extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.props.store.getState();
    }

    componentDidMount() {
        this.fetch();

        // Listen to our store
        this.props.store.listen(this.onStoreChange);
    }

    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
        }

        // Stop listening to our store
        this.props.store.unlisten(this.onStoreChange);
    }

    onStoreChange() {
        // Update our state when the store changes
        this.setState(this.props.store.getState());
    }

    fetch() {
        this.props.action.fetch();

        if (this.props.pollInterval && !this.interval) {
            this.interval = setInterval(this.fetch, this.props.pollInterval);
        }
    }

    render() {
        if (this.state.loading) {
            return (
                <div className="blankslate capped clean-background">
                    Loading
                </div>
            );
        }

        if (!this.state.data || !this.state.data.length) {
            return (
                <div className="blankslate capped clean-background">
                    No items
                </div>
            );
        }

        return (
            <div>
                <div className="d-flex flex-row">
                    <div className="col-3 pr-4">
                        <PanelListRaw
                            title="Hourly"
                            extraClass="hourly"
                            item="issue"
                            data={_.filter(this.state.data, row => _.findWhere(row.labels, {name: 'Hourly'}))}
                        />
                    </div>
                    <div className="col-3 pr-4">
                        <PanelListRaw
                            title="Daily"
                            extraClass="daily"
                            item="issue"
                            data={_.filter(this.state.data, row => _.findWhere(row.labels, {name: 'Daily'}))}
                        />
                    </div>
                    <div className="col-3 pr-4">
                        <PanelListRaw
                            title="Weekly"
                            extraClass="weekly"
                            item="issue"
                            data={_.filter(this.state.data, row => _.findWhere(row.labels, {name: 'Weekly'}))}
                        />
                    </div>
                    <div className="col-3">
                        <PanelListRaw
                            title="Monthly"
                            extraClass="monthly"
                            item="issue"
                            data={_.filter(this.state.data, row => _.findWhere(row.labels, {name: 'Monthly'}))}
                        />
                    </div>
                </div>
                <div className="pt-4">
                    <PanelListRaw
                        title="None"
                        extraClass="none"
                        item="issue"
                        // eslint-disable-next-line rulesdir/prefer-underscore-method
                        data={_.filter(this.state.data, row => _.intersection(row.labels.map(label => label.name), ['Hourly', 'Daily', 'Weekly', 'Monthly']).length === 0)}
                    />
                </div>
            </div>
        );
    }
}

ListIssuesAssigned.propTypes = propTypes;

export default ListIssuesAssigned;
