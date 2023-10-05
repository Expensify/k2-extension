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

    /**
     * Save the filters when the apply button is clicked
     *
     * @param {SyntheticEvent} e
     */
    saveFilters() {
        Issues.saveFilters({
            hideHold: this.hideHold.checked,
            hideCPlusReviewed: this.hideCPlusReviewed.checked,
            pushCPlusDown: this.pushCPlusDown.checked,

        });
    }

    render() {
        return (
            <div className="mb-3">
                <form className="form-inline" onChange={this.saveFilters}>
                    <div className="checkbox">
                        <label>
                            <input type="checkbox" name="hideHold" ref={el => this.hideHold = el} defaultChecked={this.props.filters.hideHold} />
                            Hide Hold issues/PRs
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input type="checkbox" name="hideCPlusReviewed" ref={el => this.hideCPlusReviewed = el} defaultChecked={this.props.filters.hideCPlusReviewed} />
                            Hide
                            {' '}
                            <span className="Counter ml-1" role="img" aria-label="C+ reviewed">C+🎀</span>
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input type="checkbox" name="pushCPlusDown" ref={el => this.pushCPlusDown = el} defaultChecked={this.props.filters.pushCPlusDown} />
                            Move
                            {' '}
                            <span className="Counter ml-1" role="img" aria-label="C+ reviewed">C+🎀</span>
                            {' '}
                            to the end
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
