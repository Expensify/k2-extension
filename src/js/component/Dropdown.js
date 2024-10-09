/* eslint-disable react/no-unused-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import BtnGroup from './BtnGroup';
import * as Issues from '../lib/actions/Issues';

const propTypes = {
    title: PropTypes.string.isRequired,
    isDropdown: PropTypes.bool,
};

const defaultProps = {
    isDropdown: false,
};

const data = [
    {
        buttonTitle: '📃 ✅ Reviewed Doc',
        ariaLabel: 'reviewed doc emojis',
        comment: 'I have read and reviewed this Design Doc!',
    },
    {
        buttonTitle: '✋ Attended Interview',
        ariaLabel: 'attended interview emojis',
        comment: 'I attended this interview!',
    },
    {
        buttonTitle: '🖊️ Reviewed Project Manager Application',
        ariaLabel: 'reviewed project manager emojis',
        comment: 'I have read and reviewed this Project Manager Application!',
    },
    {
        buttonTitle: '📱 Reviewed Product Manager Application',
        ariaLabel: 'reviewed product manager emojis',
        comment: 'I have read and reviewed this Product Manager Application!',
    },
];

class Dropdown extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            shouldShowConfirmationMessage: false,
            showButtons: false,
            showConfirm: false,
            messageText: '',
        };
    }

    addParticipationComment(comment) {
        Issues.addComment(comment);

        // Show the confirmation message for 5 seconds
        this.setState({shouldShowConfirmationMessage: true}, () => {
            setTimeout(() => {
                this.setState({shouldShowConfirmationMessage: false});
            }, 5000);
        });
    }

    render() {
        return (
            <div>
                <BtnGroup>
                    <button
                        type="button"
                        className={this.state.showButtons ? 'btn btn-sm selected' : 'btn btn-sm'}
                        onClick={() => this.setState(prevState => ({showButtons: !prevState.showButtons}))}
                    >
                        <span role="img" aria-label="reviewed doc emojis">
                            {`Comments shortcuts ${this.state.showButtons ? '⬆️' : '⬇️'}`}
                        </span>
                    </button>
                </BtnGroup>
                { this.state.showButtons && (
                    <>
                        <BtnGroup>
                            {data.forEach(thing => (
                                <button type="button" className="btn btn-sm">
                                    <span role="img" aria-label={thing.ariaLabel}>
                                        {thing.buttonTitle}
                                    </span>
                                </button>
                            ))}
                            {/* <button
                                type="button"
                                className="btn btn-sm"

                                // onClick={() => this.addParticipationComment('I have read and reviewed this Design Doc!')}

                                // eslint-disable-next-line rulesdir/prefer-early-return
                                onClick={() => { if (window.confirm('Did you just review a Design Doc?')) { this.addParticipationComment('I have read and reviewed this Design Doc!'); } }}
                            >
                                <span role="img" aria-label="reviewed doc emojis">
                                    📃 ✅ Reviewed Doc
                                </span>
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => this.setState({messageText: 'I attended this interview!', showConfirm: true})}
                            >
                                <span role="img" aria-label="attended interview emojis">
                                    ✋ Attended Interview
                                </span>
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => this.setState({messageText: 'I attended this interview!', showConfirm: true})}
                            >
                                <span role="img" aria-label="attended interview emojis">
                                    ✋ Attended Interview
                                </span>
                            </button> */}
                        </BtnGroup>

                        {/* <BtnGroup isDropdown>
                            <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => this.addParticipationComment('I have read and reviewed this Project Manager Application!')}
                            >
                                <span role="img" aria-label="reviewed project manager emojis">
                                    🖊️ Reviewed Project Manager Application
                                </span>
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => this.addParticipationComment('I have read and reviewed this Project Manager Application!')}
                            >
                                <span role="img" aria-label="reviewed project manager emojis">
                                    🖊️ Reviewed Project Manager Application
                                </span>
                            </button>
                        </BtnGroup>

                        <BtnGroup>
                            <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => this.addParticipationComment('I have read and reviewed this Product Manager Application!')}
                            >
                                <span role="img" aria-label="reviewed product manager emojis">
                                    📱 Reviewed Product Manager Application
                                </span>
                            </button>
                        </BtnGroup> */}
                    </>
                )}
                {this.state.showConfirm && (
                    <BtnGroup>
                        <button
                            type="button"
                            className="btn btn-sm green"
                            onClick={() => this.addParticipationComment(this.state.messageText)}
                        >
                            <span role="img" aria-label="Send Message">
                                Send Message
                            </span>
                        </button>
                    </BtnGroup>
                )}

                {this.state.shouldShowConfirmationMessage && (
                    <div>Comment added! Please wait a moment for it to appear</div>
                )}
            </div>
        );
    }
}

Dropdown.propTypes = propTypes;
Dropdown.defaultProps = defaultProps;
Dropdown.displayName = 'Dropdown';

export default Dropdown;
