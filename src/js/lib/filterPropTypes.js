import PropTypes from 'prop-types';

export default PropTypes.shape({
    /** Should improvements be included? */
    improvement: PropTypes.bool,

    /** Should tasks be included? */
    task: PropTypes.bool,

    /** Should features be included? */
    feature: PropTypes.bool,

    /** A milestone the issues should belong to */
    milestone: PropTypes.string,
});
