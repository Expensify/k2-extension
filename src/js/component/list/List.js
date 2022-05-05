import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import ListItemIssue from '../list-item/ListItemIssue';
import ListItemPull from '../list-item/ListItemPull';
import ListItemForm from '../list-item/ListItemForm';

const propTypes = {
    /** The `Alt` action used to fetch data */
    // eslint-disable-next-line react/forbid-prop-types
    action: PropTypes.object,

    /** The `Alt` store that holds the data for the list */
    // eslint-disable-next-line react/forbid-prop-types
    store: PropTypes.object,

    /** Data to display in the list */
    data: PropTypes.arrayOf(PropTypes.object).isRequired,

    /** The type of list items to display */
    type: PropTypes.oneOf(['pull', 'issue', 'review', 'form']).isRequired,
};

const defaultProps = {
    action: null,
    store: null,
};

class List extends React.Component {
    constructor(props) {
        super(props);

        if (!this.props.store) {
            this.state = {data: this.props.data};
        } else {
            this.state = this.props.store.getState();
        }
    }

    componentDidMount() {
        if (!this.props.store) {
            return;
        }
        this.props.store.listen(this.onStoreChange);
    }

    componentWillUnmount() {
        if (!this.props.store) {
            return;
        }
        this.props.store.unlisten(this.onStoreChange);
    }

    onStoreChange() {
        if (!this.props.store) {
            return;
        }
        this.setState(this.props.store.getState());
    }

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
    }

    fetch() {
        if (!this.props.action) {
            return;
        }
        this.props.action.fetch();
    }

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
    }
}

List.propTypes = propTypes;
List.defaultProps = defaultProps;

export default List;
