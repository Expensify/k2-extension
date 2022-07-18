import PropTypes from 'prop-types';

const listPropTypes = {
    /** Data to display in the list */
    data: PropTypes.arrayOf(PropTypes.object),

    /** The type of list items to display */
    type: PropTypes.oneOf(['pull', 'issue']),
};

export default listPropTypes;
