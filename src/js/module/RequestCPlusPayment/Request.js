import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import {withOnyx} from 'react-native-onyx';
import PropTypes from 'prop-types';
import BtnGroup from '../../component/BtnGroup';

// import * as API from '../../lib/api';
// import {getCurrentIssueDetails} from '../../lib/actions/Issues';
import ONYXKEYS from '../../ONYXKEYS';
import RequestPayment from '../../lib/actions/RequestPayment';

const defaultBtnClass = 'btn btn-sm tooltipped tooltipped-n typepicker';

// const participationButtons = [
//     {
//         title: '📃 ✅ Reviewed Doc',
//         ariaLabel: 'reviewed doc emojis',
//         comment: 'I have read and reviewed this Design Doc!',
//     },
//     {
//         title: '✋ Attended Interview',
//         ariaLabel: 'attended interview emojis',
//         comment: 'I attended this interview!',
//     },
//     {
//         title: '🖊️ Reviewed Project Manager Application',
//         ariaLabel: 'reviewed project manager emojis',
//         comment: 'I have read and reviewed this Project Manager Application!',
//     },
//     {
//         title: '📱 Reviewed Product Manager Application',
//         ariaLabel: 'reviewed product manager emojis',
//         comment: 'I have read and reviewed this Product Manager Application!',
//     },
// ];

const propTypes = {
    issueID: PropTypes.string.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    cPlusPaymentStatus: PropTypes.any,
};

const defaultProps = {
    cPlusPaymentStatus: {},
};

class Request extends React.Component {
    constructor(props) {
        super(props);

        this.labels = {
            'Pending Payment': `${defaultBtnClass} k2-improvement`,
            Requested: `${defaultBtnClass} k2-task`,
        };

        this.state = {
            isOpen: false,
            isButtonSelected: false,
            shouldShowConfirmationMessage: false,
            participationComment: '',
            selectedButton: {},
            amount: 1000,
            ...this.labels,
        };
    }

    // addParticipationComment(comment) {
    //     Issues.addComment(comment);

    //     // Show the confirmation message for 5 seconds
    //     this.setState({shouldShowConfirmationMessage: true}, () => {
    //         setTimeout(() => {
    //             this.setState({shouldShowConfirmationMessage: false, isButtonSelected: false});
    //         }, 5000);
    //     });
    // }

    // getRequestDescription() {
    //     const currentIssue = getCurrentIssueDetails();
    //     return `Payment for reporting bonus for ${currentIssue.title} #${currentIssue.issue_number}`;
    // }

    // makeRequest(type) {
    //     let amount = this.state.amount;
    //     const message = this.getRequestDescription();
    //     if (type === 'reporting') {
    //         amount = 250;
    //     }
    // }

    /**
     * When the component has renered, we need to see if there
     * is an existing label, and if so, make that button enabled
     *
     * @date 2015-07-30
     */
    componentDidMount() {
        if (!this.props.cPlusPaymentStatus) {
            return;
        }
        if (typeof this.props.cPlusPaymentStatus === 'string') {
            this.setState({amount: ''});
            this.setActiveLabel(this.props.cPlusPaymentStatus, () => {}, () => {});
        } else {
            this.setState({amount: this.props.cPlusPaymentStatus.amount});
            this.setActiveLabel(this.props.cPlusPaymentStatus.status, () => {}, () => {});
        }
    }

    setActiveLabel(label, onActive, onInactive) {
        let newState = {};

        // If that label is already active, then set everything back
        // to the default (which removes all labels)
        if (this.state[label].indexOf(' active') > -1) {
            this.setState(this.labels);
            onInactive();
            return;
        }

        // Set all the proper active/inactive classes
        newState = _.mapObject(this.labels, (val, key) => (key === label
            ? `${defaultBtnClass} k2-${key.toLowerCase().replace(' ', '-')} active`
            : `${defaultBtnClass} k2-${key.toLowerCase().replace(' ', '-')} inactive`));
        this.setState(newState);
        onActive();
    }

    /**
     * @param {String} label
     */
    clickNSave(label) {
        this.setActiveLabel(label,
            () => {
                RequestPayment.saveCPlusPaymentSatus(this.props.issueID, label, this.state.amount);
            },
            () => {
                RequestPayment.removeCPlusPaymentSatus(this.props.issueID);
            });
    }

    render() {
        return (
            <div>
                {/* <BtnGroup isVertical>
                    <button
                        type="button"
                        className={(this.state.isOpen || this.state.isButtonSelected) ? 'btn btn-sm selected' : 'btn btn-sm'}
                        onClick={() => this.setState(prevState => ({isOpen: !prevState.isOpen, isButtonSelected: false}))}
                    >
                        <span role="img" aria-label="reviewed doc emojis">
                            {`${this.state.isButtonSelected ? this.state.selectedButton.title : 'Request Shortcuts'}  ${this.state.isOpen ? '⬆️' : '⬇️'}`}
                        </span>
                    </button>
                    {this.state.isOpen && (
                        <>
                            <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => this.setState({
                                    participationComment: participationButton.comment, isButtonSelected: true, selectedButton: participationButton, isOpen: false,
                                })}
                            >
                                <span role="img" aria-label={participationButton.ariaLabel}>
                                    {participationButton.title}
                                </span>
                            </button>
                            {this.state.isButtonSelected ? (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-sm"
                                        onClick={() => this.setState({participationComment: '', isButtonSelected: false, selectedButton: {}})}
                                    >
                                        <span role="img" aria-label={this.state.selectedButton.ariaLabel}>
                                            {this.state.selectedButton.title}
                                        </span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    {_.map(participationButtons, participationButton => (
                                        <button
                                            type="button"
                                            className="btn btn-sm"
                                            onClick={() => this.setState({
                                                participationComment: participationButton.comment, isButtonSelected: true, selectedButton: participationButton, isOpen: false,
                                            })}
                                        >
                                            <span role="img" aria-label={participationButton.ariaLabel}>
                                                {participationButton.title}
                                            </span>
                                        </button>
                                    ))}
                                </>
                            )}
                        </>
                    )}
                </BtnGroup>
                {(this.state.isButtonSelected && !this.state.shouldShowConfirmationMessage) && (
                    <button
                        type="button"
                        className="btn btn-sm btn-primary mt-3"
                        onClick={() => this.addParticipationComment(this.state.participationComment)}
                    >
                        <span role="img" aria-label="Send Message">
                            Send Message
                        </span>
                    </button>
                )}
                {this.state.shouldShowConfirmationMessage && (
                    <div className="mt-3 text-center">
                        Comment added!
                        <br />
                        Please wait a moment for it to appear
                    </div>
                )} */}

                <div className="position-relative mt-3 flex-btns">
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                    <label className="sidebar-floated-label">Track C+ Payment</label>
                    <input
                        ref={el => this.input = el}
                        type="text"
                        htmlid="amount"
                        name="amount"
                        value={this.state.amount}
                        onChange={e => this.setState({amount: e.target.value})}
                        className="input-block form-control mb-2"
                        placeholder="Enter payment amount"
                    />
                    <BtnGroup className="d-flex">
                        <button
                            type="button"
                            className={this.state.Requested}
                            aria-label="Requested"
                            onClick={() => this.clickNSave('Requested')}
                        >
                        Requested
                        </button>
                        <button
                            type="button"
                            className={this.state['Pending Payment']}
                            aria-label="Pending Payment"
                            onClick={() => this.clickNSave('Pending Payment')}
                        >
                        Pending Payment
                        </button>
                    </BtnGroup>
                </div>
            </div>
        );
    }
}

Request.propTypes = propTypes;
Request.defaultProps = defaultProps;

export default withOnyx({
    cPlusPaymentStatus: {
        key: ({issueID}) => `${ONYXKEYS.COLLECTION.C_PLUS_PAYMENT_STATUS}${issueID}`,
    },
})(Request);
