import PropTypes from 'prop-types';

const listPropTypes = {
    /** The `Alt` action used to fetch data */
    // eslint-disable-next-line react/forbid-prop-types
    action: PropTypes.object,

    /** The `Alt` store that holds the data for the list */
    // eslint-disable-next-line react/forbid-prop-types
    store: PropTypes.object,

    /** Data to display in the list */
    data: PropTypes.arrayOf(PropTypes.object),

    /** The type of list items to display */
    type: PropTypes.oneOf(['pull', 'issue', 'review', 'form']),
};

export default listPropTypes;
