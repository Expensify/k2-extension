import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import Panel from '../../component/Panel';
import ONYXKEYS from '../../ONYXKEYS';
import IssuePropTypes from '../../component/list-item/IssuePropTypes';

const propTypes = {
    issues: PropTypes.objectOf(IssuePropTypes),
};
const defaultProps = {
    issues: {},
};

class BudgetPlanner extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            pendingAmount: 0,
            futureAmount: 0,
            predictions: 0,
        };
    }

    componentDidMount() {
        this.calculatePayments();
    }

    componentDidUpdate(prevProps) {
        if (_.isEqual(this.props.issues, prevProps.issues)) {
            return;
        }
        this.calculatePayments();
    }

    calculatePayments() {
        if (!_.size(this.props.issues)) {
            return;
        }
        let futureAmount = 0;
        let pendingAmount = 0;
        _.forEach(this.props.issues, (issue) => {
            const matchAmount = /.*\$([\d,]*)/ig;
            const matchStatus = /(HOLD for payment)+/ig;
            const matchedAmount = matchAmount.exec(issue.title);
            const matchedStatus = matchStatus.exec(issue.title);
            if (!matchedAmount) {
                return;
            }
            if (matchedStatus && matchedStatus[1]) {
                pendingAmount += matchedAmount[1] ? parseInt(matchedAmount[1].replace(',', ''), 10) : 0;
            } else {
                futureAmount += matchedAmount[1] ? parseInt(matchedAmount[1].replace(',', ''), 10) : 0;
            }
        });
        this.setState({futureAmount, pendingAmount});
    }

    render() {
        if (!this.props.issues) {
            return (
                <div className="blankslate capped clean-background">
                    Loading
                </div>
            );
        }

        return (
            <div className="mb-3">
                <div className="d-flex flex-row budget-planner">
                    <div className="col-12">
                        <Panel
                            panelID="budget"
                            title="Budget Planner"
                        >
                            <div className="d-flex flex-row p-4">
                                <div className="col-3 pr-4">
                                    <div>
                                        <h5>Pending Amount</h5>
                                        <p className="amount">
$
                                            {this.state.pendingAmount}
                                        </p>
                                    </div>

                                </div>
                                <div className="col-3 pr-4">
                                    <div>
                                        <h5>Future Amount</h5>
                                        <p className="amount">
$
                                            {this.state.futureAmount}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Panel>

                    </div>
                </div>
            </div>
        );
    }
}

BudgetPlanner.propTypes = propTypes;
BudgetPlanner.defaultProps = defaultProps;

export default withOnyx({
    issues: {
        key: ONYXKEYS.ISSUES.ASSIGNED,
    },
})(BudgetPlanner);
