import React from 'react';
import ReactNativeOnyx from 'react-native-onyx';
import {Stack, ToggleSwitch} from '@primer/react';
import ONYXKEYS from '../../ONYXKEYS';
import * as Preferences from '../../lib/actions/Preferences';
import convertTimestamps from '../../lib/timestampConverter';

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
            <Stack direction="horizontal" align="center" justify="space-between" gap="condensed">
                <span id="k2-absolute-timestamps-label">Show absolute timestamps</span>
                <ToggleSwitch
                    aria-labelledby="k2-absolute-timestamps-label"
                    checked={this.state.useAbsoluteTimestamps}
                    onChange={() => this.handleToggle()}
                    size="small"
                />
            </Stack>
        );
    }
}

export default Toggle;
