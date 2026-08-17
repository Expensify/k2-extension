import _ from 'underscore';
import moment from 'moment';

const LABEL_WEIGHTS = {
    DeployBlocker: 100000000,
    DeployBlockerCash: 100000000,
    DeployBlockerMobile: 100000000,
    'Fire Cleanup': 50000000,
    Hourly: 10000000,
    Daily: 1000000,
    Weekly: 100000,
    Monthly: 10000,
    WhatsNext: 9000,
    FirstPick: 1050,
    Improvement: 1000,
    Task: 500,
    NewFeature: 500,
};

/**
 * Score an issue by company impact so panels can rank deploy blockers and fires above
 * the K2 cadence ladder, with age as a within-tier tiebreaker (older scores higher).
 *
 * @param {Object} issue
 * @returns {Number}
 */
function scoreIssue(issue) {
    const labelScore = _.reduce(
        issue.labels,
        (total, label) => total + (LABEL_WEIGHTS[label.name] || 0),
        0,
    );
    const age = moment().diff(issue.createdAt, 'days');
    return labelScore + (age / 100);
}

export default scoreIssue;
