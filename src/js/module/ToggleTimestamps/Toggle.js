import React from 'react';
import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import * as Preferences from '../../lib/actions/Preferences';
import convertTimestamps from '../../lib/timestampConverter';

const defaultBtnClass = 'btn btn-sm';

class Toggle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            useAbsoluteTimestamps: false,
        };
        this.onyxConnection = null;
    }

    componentDidMount() {
        // Initialize with current preference
        const currentPreference = Preferences.getUseAbsoluteTimestamps();
        this.setState({useAbsoluteTimestamps: currentPreference});

        // Connect to Onyx to read the preference
        this.onyxConnection = ReactNativeOnyx.connect({
            key: ONYXKEYS.PREFERENCES,
            callback: (preferences) => {
                if (!preferences) {
                    return;
                }
                this.setState({
                    useAbsoluteTimestamps: preferences.useAbsoluteTimestamps || false,
                });
            },
        });
    }

    componentWillUnmount() {
        if (!this.onyxConnection) {
            return;
        }
        ReactNativeOnyx.disconnect(this.onyxConnection);
    }

    /**
     * Toggle the absolute timestamps preference
     */
    handleToggle() {
        this.setState((prevState) => {
            const newValue = !prevState.useAbsoluteTimestamps;
            Preferences.setUseAbsoluteTimestamps(newValue);
            convertTimestamps(newValue);
            return {useAbsoluteTimestamps: newValue};
        });
    }

    render() {
        return (
            <div style={{width: '100%'}}>
                <button
                    type="button"
                    className={this.state.useAbsoluteTimestamps
                        ? `${defaultBtnClass} k2-absolute-timestamps selected`
                        : `${defaultBtnClass} k2-absolute-timestamps`}
                    onClick={() => this.handleToggle()}
                    style={{width: '100%'}}
                >
                    {this.state.useAbsoluteTimestamps
                        ? 'Hide Timestamps'
                        : 'Show Timestamps'}
                </button>
            </div>
        );
    }
}

export default Toggle;
