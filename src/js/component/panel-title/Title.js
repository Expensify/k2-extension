import React from 'react';
import PropTypes from 'prop-types';
import ReactNativeOnyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import * as Preferences from '../../lib/actions/Preferences';

const propTypes = {
    /** The text to display */
    text: PropTypes.string.isRequired,

    /** Number of panel issues */
    count: PropTypes.number,

    /** Callback to open all items in new tabs */
    onOpenAll: PropTypes.func,
};

const defaultProps = {
    count: null,
    onOpenAll: null,
};

class Title extends React.Component {
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

    render() {
        const {text, count, onOpenAll} = this.props;
        return (
            <div>
                <h3 className="panel-title panel-title-with-actions">
                    <span>{`${text} ${count !== null ? `(${count})` : ''}`}</span>
                    {onOpenAll && count > 0 && this.state.showOpenAllButtons && (
                        <button
                            type="button"
                            className="btn btn-sm"
                            onClick={onOpenAll}
                            title={`Open all ${count} items in new tabs`}
                        >
                            Open All
                        </button>
                    )}
                </h3>
            </div>
        );
    }
}

Title.propTypes = propTypes;
Title.defaultProps = defaultProps;
Title.displayName = 'Title';

export default Title;
