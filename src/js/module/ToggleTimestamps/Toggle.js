import React from 'react';
import ReactNativeOnyx from 'react-native-onyx';
import BtnGroup from '../../component/BtnGroup';
import ONYXKEYS from '../../ONYXKEYS';
import * as Preferences from '../../lib/actions/Preferences';

const defaultBtnClass = 'btn btn-sm';

class Toggle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            useStaticTimestamps: false,
        };
        this.onyxConnection = null;
    }

    componentDidMount() {
        // Initialize with current preference
        const currentPreference = Preferences.getUseStaticTimestamps();
        this.setState({useStaticTimestamps: currentPreference});

        // Connect to Onyx to read the preference
        this.onyxConnection = ReactNativeOnyx.connect({
            key: ONYXKEYS.PREFERENCES,
            callback: (preferences) => {
                if (!preferences) {
                    return;
                }
                this.setState({
                    useStaticTimestamps: preferences.useStaticTimestamps || false,
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
     * Toggle the static timestamps preference
     */
    handleToggle() {
        this.setState((prevState) => {
            const newValue = !prevState.useStaticTimestamps;
            Preferences.setUseStaticTimestamps(newValue);
            return {useStaticTimestamps: newValue};
        });
    }

    render() {
        return (
            <div>
                <BtnGroup>
                    <button
                        type="button"
                        className={this.state.useStaticTimestamps
                            ? `${defaultBtnClass} k2-static-timestamps selected`
                            : `${defaultBtnClass} k2-static-timestamps`}
                        onClick={() => this.handleToggle()}
                    >
                        {this.state.useStaticTimestamps
                            ? 'Use Relative Timestamps'
                            : 'Use Static Timestamps'}
                    </button>
                </BtnGroup>
            </div>
        );
    }
}

export default Toggle;
