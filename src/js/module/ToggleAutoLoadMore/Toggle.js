import React from 'react';
import ReactNativeOnyx from 'react-native-onyx';
import {Stack, ToggleSwitch} from '@primer/react';
import ONYXKEYS from '../../ONYXKEYS';
import * as Preferences from '../../lib/actions/Preferences';

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
            <Stack direction="horizontal" align="center" justify="space-between" gap="condensed">
                <span id="k2-auto-load-more-label">Auto-load more comments</span>
                <ToggleSwitch
                    aria-labelledby="k2-auto-load-more-label"
                    checked={this.state.autoLoadMoreComments}
                    onChange={() => this.handleToggle()}
                    size="small"
                />
            </Stack>
        );
    }
}

export default Toggle;

// vim: set ts=4 sw=4 et:
