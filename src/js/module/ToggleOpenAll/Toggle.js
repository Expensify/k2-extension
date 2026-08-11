import React from 'react';
import ReactNativeOnyx from 'react-native-onyx';
import {Stack, ToggleSwitch} from '@primer/react';
import ONYXKEYS from '../../ONYXKEYS';
import * as Preferences from '../../lib/actions/Preferences';

class Toggle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showOpenAllButtons: Preferences.getShowOpenAllButtons(),
        };
        this.onyxConnection = null;
    }

    componentDidMount() {
        this.onyxConnection = ReactNativeOnyx.connect({
            key: ONYXKEYS.PREFERENCES,
            callback: () => {
                this.setState({showOpenAllButtons: Preferences.getShowOpenAllButtons()});
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
            const newValue = !prevState.showOpenAllButtons;
            Preferences.setShowOpenAllButtons(newValue);
            return {showOpenAllButtons: newValue};
        });
    }

    render() {
        return (
            <Stack direction="horizontal" align="center" justify="space-between" gap="condensed">
                <span id="k2-open-all-label">Show Open All buttons</span>
                <ToggleSwitch
                    aria-labelledby="k2-open-all-label"
                    checked={this.state.showOpenAllButtons}
                    onChange={() => this.handleToggle()}
                    size="small"
                />
            </Stack>
        );
    }
}

export default Toggle;

// vim: set ts=4 sw=4 et:
