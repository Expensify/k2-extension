import React from 'react';
import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import * as Preferences from '../../lib/actions/Preferences';

const defaultBtnClass = 'btn btn-sm';

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
            <div style={{width: '100%', marginTop: '4px'}}>
                <button
                    type="button"
                    className={this.state.showOpenAllButtons
                        ? `${defaultBtnClass} k2-show-open-all selected`
                        : `${defaultBtnClass} k2-show-open-all`}
                    onClick={() => this.handleToggle()}
                    style={{width: '100%'}}
                >
                    {this.state.showOpenAllButtons
                        ? 'Open All buttons: On'
                        : 'Open All buttons: Off'}
                </button>
            </div>
        );
    }
}

export default Toggle;

// vim: set ts=4 sw=4 et:
