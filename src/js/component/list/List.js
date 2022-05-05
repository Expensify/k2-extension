import React from 'react';
import _ from 'underscore';
import ListItemIssue from '../list-item/ListItemIssue';
import ListItemPull from '../list-item/ListItemPull';
import ListItemForm from '../list-item/ListItemForm';

/**
 * List
 *
 * Display a list of items depending on the type
 *
 * @param {array} data which will be displayed as items
 * @param {object} options
 */

export default React.createClass({
    getInitialState() {
        if (!this.props.store) {
            return {data: this.props.data};
        }
        return this.props.store.getState();
    },

    fetch() {
        if (!this.props.action) {
            return;
        }
        this.props.action.fetch();
    },

    componentDidMount() {
        if (!this.props.store) {
            return;
        }
        this.props.store.listen(this.onStoreChange);
    },

    componentWillUnmount() {
        if (!this.props.store) {
            return;
        }
        this.props.store.unlisten(this.onStoreChange);
    },

    onStoreChange() {
        if (!this.props.store) {
            return;
        }
        this.setState(this.props.store.getState());
    },

    /**
     * Gets the items to display using the proper item
     * component
     *
     * @date 2015-06-10
     *
     * @return {array}
     */
    getItems() {
        const type = this.props.type;

        return _.map(this.state.data, (item) => {
            let result;
            switch (type) {
                case 'issue': result = (<ListItemIssue key={`issue_${item.id}`} data={item} />); break;
                case 'pull': result = (<ListItemPull key={`pull_${item.id}`} data={item} />); break;
                case 'review': result = (<ListItemPull key={`review_${item.id}`} data={item} />); break;
                case 'form': result = (<ListItemForm key={`form_${item.id}`} data={item} />); break;
                default: result = null;
            }
            return result;
        });
    },

    render() {
        if (this.state.loading) {
            return (
                <div className="blankslate capped clean-background">
                    Loading
                </div>
            );
        }

        if (this.state.retrying) {
            return (
                <div className="blankslate capped clean-background">
                    Automatically retrying in x seconds
                </div>
            );
        }

        if (!_.size(this.state.data)) {
            return (
                <div className="blankslate capped clean-background">
                    No items
                </div>
            );
        }

        return (
            <div>
                {this.getItems()}
            </div>
        );
    },
});
