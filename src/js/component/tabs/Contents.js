import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import PropTypes from 'prop-types';
import * as prefs from '../../lib/prefs';
import * as API from '../../lib/api';
import ListItemIssue from '../list-item/ListItemIssue';
import ListItemPull from '../list-item/ListItemPull';
import ListItemForm from '../list-item/ListItemForm';

const propTypes = {
    /** The API method that will be called to load the data */
    apiMethod: PropTypes.string.isRequired,

    /** The type of items that are being displayed */
    type: PropTypes.oneOf(['issue']).isRequired,

    /** The number of milliseconds that will be used for refreshing the data */
    pollInterval: PropTypes.number.isRequired,
};
const defaultProps = {};

class Contents extends React.Component {
    constructor(props) {
        super(props);

        this.callApi = this.callApi.bind(this);

        this.fetched = false;

        this.state = {
            error: null,
            loading: true,
            retrying: false,
            retryingIn: 0,
            data: [],
        };
    }

    componentDidMount() {
        this.loadData();
    }

    componentDidUpdate(prevProps) {
        if (this.props.apiMethod === prevProps.apiMethod) {
            return;
        }

        this.fetched = false;
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({
            loading: true,
            retrying: false,
            error: null,
        }, () => {
            this.loadData();
        });
    }

    loadData() {
        // Don't load any data if we have already fetched it
        if (this.fetched) {
            return;
        }

        if (!API[this.props.apiMethod]) {
            throw new Error(`The method ${this.props.apiMethod} does not exist on the API module`);
        }

        this.callApi();

        this.fetched = true;
    }

    callApi() {
        clearInterval(this.interval);
        API[this.props.apiMethod]((error, data) => {
            if (error) {
                return this.setState({
                    error: 'There was an error loading data. Refresh the page to try again.',
                    loading: false,
                    retrying: false,
                });
            }

            this.unfilteredData = data;

            // Update the tab counter
            $(`[data-key="${this.props.apiMethod}"] .Counter`).html(data.length);

            // Apply issue filters if we need to
            prefs.get('issueFilters', (issueFilters) => {
                let filteredData = data;
                if (this.props.type === 'issue' && issueFilters && !_.isEmpty(issueFilters)) {
                    filteredData = this.filterData(issueFilters);
                }

                this.setState({
                    loading: false,
                    retrying: false,
                    data: filteredData,
                });

                if (this.props.pollInterval) {
                    this.interval = setInterval(this.callApi, this.props.pollInterval);
                }
            });
        }, (data) => {
            // Handle the API retrying
            this.setState({
                loading: false,
                retrying: true,
                retryingIn: Math.round(data / 1000),
            });
        });
    }

    /**
     * Refreshes our data with the given filters
     * @public
     * @param {Object} filters
     */
    refreshWithFilters(filters) {
        if (this.state.loading || this.state.retrying) {
            return;
        }

        if (filters && !_.isEmpty(filters)) {
            this.setState({
                data: this.filterData(filters),
            });
        }
    }

    filterData(filters) {
        return _.filter(this.unfilteredData, (item) => {
            const isImprovement = _.findWhere(item.labels, {name: 'Improvement'});
            const isTask = _.findWhere(item.labels, {name: 'Task'});
            const isFeature = _.findWhere(item.labels, {name: 'NewFeature'});
            const isOnMilestone = item.milestone && item.milestone.id.toString() === filters.milestone;

            // If we are filtering on milestone, remove everything not on that milestone
            if (filters.milestone && !isOnMilestone) {
                return false;
            }
            return (filters.improvement && isImprovement)
                || (filters.task && isTask)
                || (filters.feature && isFeature);
        });
    }

    render() {
        if (this.state.error) {
            return (
                <div className="panel">
                    <div className="blankslate capped clean-background">
                        Error:
                        {this.state.error}
                    </div>
                </div>
            );
        }

        if (this.state.loading) {
            return (
                <div className="panel">
                    <div className="blankslate capped clean-background">Loading...</div>
                </div>
            );
        }

        if (this.state.retrying) {
            return (
                <div className="panel">
                    <div className="blankslate capped clean-background">
                        Retrying in
                        {this.state.retryingIn}
                        {' '}
                        seconds
                    </div>
                </div>
            );
        }

        return (
            <div className="panel">
                <div>
                    {_.map(this.state.data, (item) => {
                        let result;
                        switch (this.props.type) {
                            case 'issue': result = <ListItemIssue key={item.id} data={item} />; break;
                            case 'pull': result = <ListItemPull key={item.id} data={item} />; break;
                            case 'form': result = <ListItemForm key={item.id} data={item} />; break;
                            default: result = null; break;
                        }
                        return result;
                    })}
                </div>
            </div>
        );
    }
}

Contents.propTypes = propTypes;
Contents.defaultProps = defaultProps;

export default Contents;
