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

  GistDB.get(`${currentView}.hidden`, (err, data) => {
    if (!err) {
      if (!data) {
        data = [];
      }
      data.push(id);

      cb(milestones);

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

  GistDB.get(`${currentView}.hidden`, (err, data) => {
    if (!err) {
      if (!data) {
        data = [];
      }
      data = _(data).without(id);

      cb(milestones);

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
