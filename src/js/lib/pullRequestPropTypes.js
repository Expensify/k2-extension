import PropTypes from 'prop-types';

export default PropTypes.shape({
    /** The conclusion of any */
    checkConclusion: PropTypes.string,

    /** The date that the PR was updated */
    updatedAt: PropTypes.string.isRequired,

    /** The title of the PR */
    title: PropTypes.string.isRequired,

    /** The URL to the PR */
    url: PropTypes.string.isRequired,

    /** Whether or not the PR is a draft */
    isDraft: PropTypes.bool.isRequired,

    /** The current state of the PR merge */
    mergable: PropTypes.oneOf(['MERGEABLE', 'CONFLICTING', 'UNKNOWN']),

    /** The status of PR reviews */
    reviewDecision: PropTypes.oneOf(['CHANGES_REQUESTED', 'APPROVED', 'REVIEW_REQUIRED']).isRequired,

    /** Info about comments on the PR */
    comments: PropTypes.shape({
        /** The number of comments on the PR */
        totalCount: PropTypes.number,
    }),

    /** Whether or not the user is done reviewing */
    userIsFinishedReviewing: PropTypes.bool,

    /** Info about reviews on the PR */
    reviews: PropTypes.shape({
        /** The number of comments on the PR */
        totalCount: PropTypes.number,
    }),
});
