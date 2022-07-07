import React from 'react';
import PropTypes from 'prop-types';
import Title from '../panel-title/Title';
import ListRaw from '../list/ListRaw';
import IssuePropTypes from '../list-item/IssuePropTypes';

const propTypes = {
    /** A CSS class to add to this panel to give it some color */
    extraClass: PropTypes.string.isRequired,

    /** The title of the panel */
    title: PropTypes.string.isRequired,

    /** The data that will be displayed in the list */
    data: PropTypes.objectOf(IssuePropTypes).isRequired,
};

const PanelListRaw = props => (
    <div className={`panel ${props.extraClass}`}>
        <Title text={props.title} />
        <ListRaw
            data={props.data}
        />
    </div>
);

PanelListRaw.propTypes = propTypes;
PanelListRaw.displayName = 'PanelListRaw';
export default PanelListRaw;
