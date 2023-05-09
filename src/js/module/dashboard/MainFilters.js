import _ from 'underscore';
import React from 'react';
import {withOnyx} from 'react-native-onyx';
import * as Issues from '../../lib/actions/Issues';
import ONYXKEYS from '../../ONYXKEYS';
import filterPropTypes from '../../lib/filterPropTypes';

const propTypes = {
    /** The filters to apply to the GH issues */
    filters: filterPropTypes,
};
const defaultProps = {
    filters: {},
};

class Filters extends React.Component {
    constructor(props) {
        super(props);

        this.saveFilters = this.saveFilters.bind(this);
    }

    componentDidUpdate() {
        if (!this.props.filters || _.isEmpty(this.props.filters)) {
            return;
        }

        // this.hideHold.checked = this.props.filters.hideHold;
    }

    /**
     * Save the filters when the apply button is clicked
     *
     * @param {SyntheticEvent} e
     */
    saveFilters(e) {
        e.preventDefault();

        Issues.saveFilters({
            hideHold: this.hideHold.checked,
        });
    }

    render() {
        return (
            <div className="mb-3">
                <form className="form-inline" onChange={this.saveFilters}>
                    <div className="checkbox">
                        <label>
                            <input type="checkbox" name="hideHold" ref={el => this.hideHold = el} checked={this.props.filters.hideHold} />
                            Hide Hold issues/PRs
                        </label>
                    </div>

                </form>
            </div>
        );
    }
}

Filters.propTypes = propTypes;
Filters.defaultProps = defaultProps;

export default withOnyx({
    filters: {
        key: ONYXKEYS.ISSUES.FILTER,
    },
})(Filters);
