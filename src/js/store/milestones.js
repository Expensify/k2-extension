
const _ = require('underscore');

const GistDB = require('../lib/gistdb');

/**
 * Save the milestone data to our DB
 * @param {String} currentView
 * @param {Array} milestones
 */
function saveMilestoneData(currentView, milestones) {
    const data = _.map(milestones, m => ({
        id: m.id,
        hidden: m.hidden,
        issues: _.pluck(m.issues, 'id'),
    }));

    // Set our milestone as hidden in our DB
    GistDB.set(`${currentView}.milestones`, data);
}

/**
 * Hide a milestone in the given collection for the given view
 * @param {String} currentView
 * @param {Number} id
 * @param {Array} milestones
 * @param {Function} cb
 */
exports.hide = function (currentView, id, milestones, cb) {
    const targetMilestone = _.findWhere(milestones, {id});

    targetMilestone.hidden = true;

    cb(milestones);

    saveMilestoneData(currentView, milestones);
};

/**
 * Show a milestone in the given collection for the given view
 * @param {String} currentView
 * @param {Number} id
 * @param {Array} milestones
 * @param {Function} cb
 */
exports.show = function (currentView, id, milestones, cb) {
    const targetMilestone = _.findWhere(milestones, {id});

    targetMilestone.hidden = false;

    cb(milestones);

    saveMilestoneData(currentView, milestones);
};

/**
 * Move a milestone up in the order
 * @param {String} currentView
 * @param {Number} id
 * @param {Array} milestones
 * @param {Function} cb
 */
exports.moveUp = function (currentView, id, milestones, cb) {
    const currentIndex = _.findIndex(milestones, {id});
    let newIndex = 0;

    // Find the first milestone above the current one that is not hidden
    for (let i = currentIndex; i >= 0; i--) {
        if (!newIndex && !milestones[i].hidden && milestones[i].id !== id) {
            newIndex = i;
            break;
        }
    }

    // Swap the array elements
    const tempObjectCopy = milestones[newIndex];
    milestones[newIndex] = milestones[currentIndex];
    milestones[currentIndex] = tempObjectCopy;

    cb(milestones);

    saveMilestoneData(currentView, milestones);
};

/**
 * Move a milestone down in the order
 * @param {String} currentView
 * @param {Number} id
 * @param {Array} milestones
 * @param {Function} cb
 */
exports.moveDown = function (currentView, id, milestones, cb) {
    const currentIndex = _.findIndex(milestones, {id});
    let newIndex = 0;

    // Find the first milestone below the current one that is not hidden
    for (let i = currentIndex; i < milestones.length; i++) {
        if (!newIndex && !milestones[i].hidden && milestones[i].id !== id) {
            newIndex = i;
            break;
        }
    }

    // Swap the array elements
    const tempObjectCopy = milestones[newIndex];
    milestones[newIndex] = milestones[currentIndex];
    milestones[currentIndex] = tempObjectCopy;

    cb(milestones);

    saveMilestoneData(currentView, milestones);
};

/**
 * Move an issue up in a milestone
 * @param {String} currentView
 * @param {Number} milestoneId
 * @param {Number} issueId
 * @param {Array} milestones
 * @param {Function} cb
 */
exports.moveIssueUp = function (currentView, milestoneId, issueId, milestones, cb) {
    const currentMilestone = _.findWhere(milestones, {id: milestoneId});

    if (!currentMilestone) {
        console.log('Could not find milestone', milestoneId, milestones);
        cb(milestones);
        return;
    }

    const currentIndex = _.findIndex(currentMilestone.issues, {id: issueId});
    let newIndex = 0;

    // Find the first issue below the current one
    for (let i = currentIndex; i >= 0; i--) {
        if (!newIndex && currentMilestone.issues[i].id !== issueId) {
            newIndex = i;
            break;
        }
    }

    // Swap the array elements
    const tempObjectCopy = currentMilestone.issues[newIndex];
    currentMilestone.issues[newIndex] = currentMilestone.issues[currentIndex];
    currentMilestone.issues[currentIndex] = tempObjectCopy;

    cb(milestones);

    saveMilestoneData(currentView, milestones);
};

/**
 * Move an issue down in a milestone
 * @param {String} currentView
 * @param {Number} milestoneId
 * @param {Number} issueId
 * @param {Array} milestones
 * @param {Function} cb
 */
exports.moveIssueDown = function (currentView, milestoneId, issueId, milestones, cb) {
    const currentMilestone = _.findWhere(milestones, {id: milestoneId});

    if (!currentMilestone) {
        console.log('Could not find milestone', milestoneId, milestones);
        cb(milestones);
        return;
    }

    const currentIndex = _.findIndex(currentMilestone.issues, {id: issueId});
    let newIndex = 0;

    // Find the first issue below the current one
    for (let i = currentIndex; i < currentMilestone.issues.length; i++) {
        if (!newIndex && currentMilestone.issues[i].id !== issueId) {
            newIndex = i;
            break;
        }
    }

    // Swap the array elements
    const tempObjectCopy = currentMilestone.issues[newIndex];
    currentMilestone.issues[newIndex] = currentMilestone.issues[currentIndex];
    currentMilestone.issues[currentIndex] = tempObjectCopy;

    cb(milestones);

    saveMilestoneData(currentView, milestones);
};

/**
 * Goes through an array of issues and places each one in the issues array for the proper milestone
 * @param {String} currentView
 * @param {Object[]} issues
 * @param {Object[]} milestones
 * @param {Function} cb
 */
exports.addIssuesToMilestones = function (currentView, issues, milestones, cb) {
    // Get the issue IDs stored in our DB because they are in the order we want
    GistDB.get(`${currentView}.milestones`, (err, storedMilestoneData) => {
        if (err) {
            console.error(err);
            cb(milestones);
            return;
        }

        // Clear out any issues that already exist
        _.each(milestones, (milestone) => {
            if (milestone.issues && milestone.issues.length) {
                milestone.issues = [];
            }
        });

        _.each(issues, (issue) => {
            if (issue.milestone) {
                const milestone = _.findWhere(milestones, {id: issue.milestone.id});
                if (!milestone) {
                    return;
                }
                if (!milestone.issues) {
                    milestone.issues = [];
                }

                milestone.issues.push(issue);
            }
        });

        // Now put this issues in the same order as is saved in our DB
        _.each(milestones, (milestone) => {
            if (!milestone.issues || !milestone.issues.length) {
                return;
            }

            const orderedIssueArray = [];
            const unorderedIssueArray = [];
            const milestoneFromDB = _.findWhere(storedMilestoneData, {id: milestone.id});
            if (!milestoneFromDB || !milestoneFromDB.issues || !milestoneFromDB.issues.length) {
                return;
            }

            _.each(milestone.issues, (issue) => {
                const index = _.indexOf(milestoneFromDB.issues, issue.id);
                if (index < 0) {
                    unorderedIssueArray.push(issue);
                } else {
                    orderedIssueArray[index] = issue;
                }
            });

            milestone.issues = _.compact(unorderedIssueArray.concat(orderedIssueArray));
        });

        cb(milestones);
    });
};
