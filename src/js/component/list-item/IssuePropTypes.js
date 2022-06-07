import PropTypes from 'prop-types';

export default PropTypes.shape({
    /** The GH generated ID of the issue */
    id: PropTypes.string.isRequired,

    /** The URL to the issue in GH */
    url: PropTypes.string.isRequired,

    /** The labels that the issue is assigned to */
    labels: PropTypes.arrayOf(PropTypes.shape({
        /** The name of the label */
        name: PropTypes.string.isRequired,
    })),

    /** The title of the issue */
    title: PropTypes.string.isRequired,
});
