'use strict';

const _ = require('underscore');

const GistDB = require('../lib/gistdb');

/**
 * Save the milestone data to our DB
 * @param {String} currentView
 * @param {Array} milestones
 */
function saveMilestoneData(currentView, milestones) {
  const data = _(milestones).map(m => {
    return {
      id: m.id,
      hidden: m.hidden,
      issues: _(m.issues).pluck('id')
    };
  });

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
  const targetMilestone = _(milestones).findWhere({id});

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
  const targetMilestone = _(milestones).findWhere({id});

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
  const currentIndex = _(milestones).findIndex({id});
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
  const currentIndex = _(milestones).findIndex({id});
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
  const currentMilestone = _(milestones).findWhere({id: milestoneId});

  if (!currentMilestone) {
    console.log('Could not find milestone', milestoneId, milestones);
    cb(milestones);
    return;
  }

  const currentIndex = _(currentMilestone.issues).findIndex({id: issueId});
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
  const currentMilestone = _(milestones).findWhere({id: milestoneId});

  if (!currentMilestone) {
    console.log('Could not find milestone', milestoneId, milestones);
    cb(milestones);
    return;
  }

  const currentIndex = _(currentMilestone.issues).findIndex({id: issueId});
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
    _(milestones).each(milestone => {
      if (milestone.issues && milestone.issues.length) {
        milestone.issues = [];
      }
    });

    _(issues).each(issue => {
      if (issue.milestone) {
        const milestone = _(milestones).findWhere({id: issue.milestone.id});
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
    _(milestones).each(milestone => {
      if (!milestone.issues || !milestone.issues.length) {
        return;
      }

      const orderedIssueArray = [];
      const milestoneFromDB = _(storedMilestoneData).findWhere({id: milestone.id});
      if (!milestoneFromDB || !milestoneFromDB.issues || !milestoneFromDB.issues.length) {
        return;
      }

      _(milestone.issues).each(issue => {
        const index = _(milestoneFromDB.issues).indexOf(issue.id);
        if (index < 0) {
          orderedIssueArray.push(issue);
        } else {
          orderedIssueArray[index] = issue;
        }
      });

      milestone.issues = orderedIssueArray;
    });

    cb(milestones);
  });
};
