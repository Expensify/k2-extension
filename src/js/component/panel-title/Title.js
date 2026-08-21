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

    /** A checkbox to show next to the title */
    checkbox: PropTypes.shape({
        /** The id and the name of the input */
        id: PropTypes.string.isRequired,

        /** The text to show next to the input */
        label: PropTypes.string.isRequired,

        /** Whether the checkbox is checked */
        isChecked: PropTypes.bool,

        /** Callback when the user toggles the checkbox */
        onChange: PropTypes.func.isRequired,
    }),
};

const defaultProps = {
    count: null,
    onOpenAll: null,
    checkbox: null,
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
        const {
            text, count, onOpenAll, checkbox,
        } = this.props;
        return (
            <div>
                <h3 className="panel-title panel-title-with-actions">
                    <span>
                        {`${text} ${count !== null ? `(${count})` : ''}`}
                        {checkbox && (
                            <label className="panel-title-checkbox" htmlFor={checkbox.id}>
                                <input
                                    type="checkbox"
                                    id={checkbox.id}
                                    name={checkbox.id}
                                    checked={!!checkbox.isChecked}
                                    onChange={checkbox.onChange}
                                />
                                {checkbox.label}
                            </label>
                        )}
                    </span>
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
