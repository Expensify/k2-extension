import React from 'react';
import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import * as Preferences from '../../lib/actions/Preferences';

const defaultBtnClass = 'btn btn-sm';

class Toggle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            autoLoadMoreComments: Preferences.getAutoLoadMoreComments(),
        };
        this.onyxConnection = null;
    }

    componentDidMount() {
        this.onyxConnection = ReactNativeOnyx.connect({
            key: ONYXKEYS.PREFERENCES,
            callback: () => {
                this.setState({autoLoadMoreComments: Preferences.getAutoLoadMoreComments()});
            },
        });
    }

    componentWillUnmount() {
        if (!this.onyxConnection) {
            return;
        }
        ReactNativeOnyx.disconnect(this.onyxConnection);
    }

    handleToggle() {
        this.setState((prevState) => {
            const newValue = !prevState.autoLoadMoreComments;
            Preferences.setAutoLoadMoreComments(newValue);
            return {autoLoadMoreComments: newValue};
        });
    }

    render() {
        return (
            <div style={{width: '100%'}}>
                <button
                    type="button"
                    className={this.state.autoLoadMoreComments
                        ? `${defaultBtnClass} k2-auto-load-more selected`
                        : `${defaultBtnClass} k2-auto-load-more`}
                    onClick={() => this.handleToggle()}
                    style={{width: '100%'}}
                >
                    {this.state.autoLoadMoreComments
                        ? 'Auto-load comments: On'
                        : 'Auto-load comments: Off'}
                </button>
            </div>
        );
    }
}

export default Toggle;

// vim: set ts=4 sw=4 et:
