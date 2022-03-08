import React from 'react';
import Title from '../panel-title/Title';

const ListRaw = require('../list/raw');

const propTypes = {
    /** A CSS class to add to this panel to give it some color */
    extraClass: React.PropTypes.string.isRequired,

    /** The title of the panel */
    title: React.PropTypes.string.isRequired,

    /** The type of data being displayed in the list */
    item: React.PropTypes.oneOf(['issue', 'pull', 'review', 'form']).isRequired,

    /** The data that will be displayed in the list */
    data: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
};

const PanelListRaw = props => (
    <div className={`panel ${props.extraClass}`}>
        <Title text={props.title} />
        <ListRaw
            type={props.item}
            data={props.data}
        />
    </div>
);

PanelListRaw.propTypes = propTypes;
PanelListRaw.displayName = 'ListRaw';
export default PanelListRaw;
