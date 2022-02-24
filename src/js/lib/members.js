import _ from 'underscore';
import * as API from './api';

// A map of members where the key is the member login
let members = {};

/**
 * Gets all of our members from the organization and saves them in a cache
 * @param {Function} cb
 */
function init(cb) {
    API.getOrganizationMembers((err, data) => {
        if (err) {
            return cb(err);
        }

        // Create our mapping
        members = _.indexBy(data, 'login');

        cb(null, members);
    });
}

/**
 * Returns the name of a user based on their login
 * @param {String} login
 * @returns {String}
 */
function getNameFromLogin(login) {
    return members[login] ? members[login].name : login;
}

export {
    init,
    getNameFromLogin,
};
