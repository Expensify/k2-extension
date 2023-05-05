import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import Title from '../panel-title/Title';
import ONYXKEYS from '../../ONYXKEYS';
// eslint-disable-next-line rulesdir/prefer-import-module-contents
import {togglePanel} from '../../lib/actions/dashboard';

const propTypes = {
    /** A CSS class to add to this panel to give it some color */
    extraClass: PropTypes.string.isRequired,

    /** The title of the panel */
    title: PropTypes.string.isRequired,

    /** If there are no issues to list in the panel, hide the panel entirely */
    hideOnEmpty: PropTypes.bool,

    // eslint-disable-next-line react/forbid-prop-types
    panel: PropTypes.object,
    panelID: PropTypes.string.isRequired,

    titleCount: PropTypes.number,
    // eslint-disable-next-line react/forbid-prop-types
    children: PropTypes.any,
};
const defaultProps = {
    hideOnEmpty: false,
    panel: {},
    titleCount: null,
    children: undefined,
};

const Panel = (props) => {
    const collapseContent = useCallback(() => {
        togglePanel(props.panelID, !props.panel.isHidden);
    }, [props.panel]);

    if (props.hideOnEmpty) {
        return null;
    }

    return (
        <div className={`panel ${props.extraClass}`}>
            <Title
                text={props.title}
                count={props.titleCount}
                onClick={collapseContent}
            />
            <div className={`collapse ${props.panel.isHidden ? 'hidden' : ''}`}>
                {!props.children ? (
                    <div className="blankslate capped clean-background">
                    No items
                    </div>
                ) : (
                    <div>
                        {props.children}
                    </div>
                )}
            </div>

        </div>
    );
};

Panel.propTypes = propTypes;
Panel.defaultProps = defaultProps;
Panel.displayName = 'PanelIssues';

export default withOnyx({
    filters: {
        key: ONYXKEYS.ISSUES.FILTER,
    },
    panel: {
        key: ({panelID}) => `${ONYXKEYS.PANEL}${panelID}`,
    },
})(Panel);
