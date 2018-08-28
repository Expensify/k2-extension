'use strict';

const _ = require('underscore');

const GistDB = require('../lib/gistdb');

/**
 * Hide a milestone in the given collection for the given view
 * @param {String} currentView
 * @param {Number} id
 * @param {Array} milestones
 * @param {Function} cb
 */
exports.hide = function (currentView, id, milestones, cb) {
  // First update our object by setting the visibility
  // Then update the visibility in our DB
  const originalMilestones = milestones.slice();
  const targetMilestone = _(milestones).findWhere({id});

  targetMilestone.hidden = true;

  cb(milestones);

  GistDB.get(`${currentView}.hidden`, (err, data) => {
    if (!err) {
      if (!data) {
        data = [];
      }
      data.push(id);

      // Set our milestone as hidden in our DB
      GistDB.set(`${currentView}.hidden`, data, (e) => {
        // If there was an error, return our original collection
        if (e) {
          return cb(originalMilestones);
        }
      });
    }
  });
};

/**
 * Show a milestone in the given collection for the given view
 * @param {String} currentView
 * @param {Number} id
 * @param {Array} milestones
 * @param {Function} cb
 */
exports.show = function (currentView, id, milestones, cb) {
  // First update our object by setting the visibility
  // Then update the visibility in our DB
  const originalMilestones = milestones.slice();
  const targetMilestone = _(milestones).findWhere({id});

  targetMilestone.hidden = false;

  cb(milestones);

  GistDB.get(`${currentView}.hidden`, (err, data) => {
    if (!err) {
      if (!data) {
        data = [];
      }
      data = _(data).without(id);

      // Set our milestone as hidden in our DB
      GistDB.set(`${currentView}.hidden`, data, (e) => {
        // If there was an error, return our original collection
        if (e) {
          return cb(originalMilestones);
        }
      });
    }
  });
};

/**
 * Move a milestone up in the order
 * @param {String} currentView
 * @param {Number} id
 * @param {Array} milestones
 * @param {Function} cb
 */
exports.moveUp = function (currentView, id, milestones, cb) {
  // First update the collection, the save that to the DB
  const originalMilestones = milestones.slice();
  const currentIndex = _(milestones).findIndex({id});
  const newIndex = Math.max(currentIndex - 1, 0);

  // Swap the array elements
  const tempObjectCopy = milestones[newIndex];
  milestones[newIndex] = milestones[currentIndex];
  milestones[currentIndex] = tempObjectCopy;

  cb(milestones);

  GistDB.get(`${currentView}.milestoneorder`, (err, data) => {
    if (!err) {
      if (!data) {
        data = [];
      }

      data = _(milestones).pluck('id');

      // Set our milestone as hidden in our DB
      GistDB.set(`${currentView}.milestoneorder`, data, (e) => {
        // If there was an error, return our original collection
        if (e) {
          return cb(originalMilestones);
        }
      });
    }
  });
};

/**
 * Move a milestone down in the order
 * @param {String} currentView
 * @param {Number} id
 * @param {Array} milestones
 * @param {Function} cb
 */
exports.moveDown = function (currentView, id, milestones, cb) {
  // First update the collection, the save that to the DB
  const originalMilestones = milestones.slice();
  const currentIndex = _(milestones).findIndex({id});
  const newIndex = Math.min(currentIndex + 1, milestones.length - 1);

  // Swap the array elements
  const tempObjectCopy = milestones[newIndex];
  milestones[newIndex] = milestones[currentIndex];
  milestones[currentIndex] = tempObjectCopy;

  cb(milestones);

  GistDB.get(`${currentView}.milestoneorder`, (err, data) => {
    if (!err) {
      if (!data) {
        data = [];
      }

      data = _(milestones).pluck('id');

      // Set our milestone as hidden in our DB
      GistDB.set(`${currentView}.milestoneorder`, data, (e) => {
        // If there was an error, return our original collection
        if (e) {
          return cb(originalMilestones);
        }
      });
    }
  });
};
