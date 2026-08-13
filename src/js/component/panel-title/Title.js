import React from 'react';
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
            <Stack className="k2-section-header" direction="horizontal" align="center" justify="space-between" gap="condensed" padding="normal">
                <Stack direction="horizontal" align="center" gap="condensed">
                    <Heading as="h2" className="k2-section-heading">{text}</Heading>
                    {count !== null && <CounterLabel>{count}</CounterLabel>}
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
