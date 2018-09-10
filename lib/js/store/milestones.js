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
