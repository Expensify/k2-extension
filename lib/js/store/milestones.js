'use strict';

const _ = require('underscore');

const GistDB = require('../lib/gistdb');

/**
 * Save the milestone data to our DB
 * @param {String} currentView
 * @param {Array} milestones
 */
function saveMilestoneData(currentView, milestones) {
  const data = _(milestones).map(m => ({
    id: m.id,
    hidden: m.hidden
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
  cb(milestones);

  saveMilestoneData(currentView, milestones);
};

/**
 * Goes through an array of issues and places each one in the issues array for the proper milestone
 * @param {Object[]} issues
 * @param {Object[]} milestones
 * @returns {*}
 */
exports.addIssuesToMilestones = function (issues, milestones) {
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
        console.log('Could not find milestone', issue.milestone, milestones);
        return;
      }
      if (!milestone.issues) {
        milestone.issues = [];
      }
      milestone.issues.push(issue);
    }
  });
  return milestones;
};
