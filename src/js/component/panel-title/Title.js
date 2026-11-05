import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import ReactNativeOnyx from 'react-native-onyx';
import {
    Button, CounterLabel, Heading, Stack,
} from '@primer/react';
import {LinkExternalIcon} from '@primer/octicons-react';
import ONYXKEYS from '../../ONYXKEYS';
import * as Preferences from '../../lib/actions/Preferences';

const propTypes = {
    /** The text to display */
    text: PropTypes.string.isRequired,

    /** Number of panel issues */
    count: PropTypes.number,

    /** Callback to open all items in new tabs */
    onOpenAll: PropTypes.func,

    /** Checkboxes to show next to the title */
    checkboxes: PropTypes.arrayOf(PropTypes.shape({
        /** The id and the name of the input */
        id: PropTypes.string.isRequired,

        /** The text to show next to the input */
        label: PropTypes.string.isRequired,

        /** Whether the checkbox is checked */
        isChecked: PropTypes.bool,

        /** Callback when the user toggles the checkbox */
        onChange: PropTypes.func.isRequired,
    })),
};

const defaultProps = {
    count: null,
    onOpenAll: null,
    checkboxes: [],
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
            text, count, onOpenAll, checkboxes,
        } = this.props;
        return (
            <Stack className="k2-section-header" direction="horizontal" align="center" justify="space-between" gap="condensed" padding="normal">
                <Stack direction="horizontal" align="center" gap="condensed" wrap="wrap">
                    <Heading as="h2" className="k2-section-heading" variant="small">{text}</Heading>
                    {count !== null && <CounterLabel>{count}</CounterLabel>}
                    {_.map(checkboxes, checkbox => (
                        <label key={checkbox.id} className="k2-section-heading-checkbox" htmlFor={checkbox.id}>
                            <input
                                type="checkbox"
                                id={checkbox.id}
                                name={checkbox.id}
                                checked={!!checkbox.isChecked}
                                onChange={checkbox.onChange}
                            />
                            {checkbox.label}
                        </label>
                    ))}
                </Stack>
                {onOpenAll && count > 0 && this.state.showOpenAllButtons && (
                    <Button
                        size="small"
                        leadingVisual={LinkExternalIcon}
                        onClick={onOpenAll}
                        title={`Open all ${count} items in new tabs`}
                    >
                        Open All
                    </Button>
                )}
            </Stack>
        );
    }
}

Title.propTypes = propTypes;
Title.defaultProps = defaultProps;
Title.displayName = 'Title';

export default Title;
