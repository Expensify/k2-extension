import $ from 'jquery';
import _ from 'underscore';
import moment from 'moment';
import * as Preferences from './actions/Preferences';
import * as GistDB from './gistdb';

const baseUrl = 'https://api.github.com';

/**
 * Returns the current github user
 *
 * @returns {String}
 */
function getCurrentUser() {
    const params = new URLSearchParams(window.location.search);
    const currentUser = params.get('currentUser') ? params.get('currentUser') : $('.Header-link .avatar').attr('alt');
    return currentUser.replace('@', '');
}

/**
 * Returns the name of the current repo
 *
 * @returns {String}
 */
function getRepo() {
    return $('#repository-container-header strong a').text();
}

/**
 * Returns the name of the current repo owner
 *
 * @returns {String}
 */
function getOwner() {
    return $('#repository-container-header .author a').text();
}

function parse_link_header(header) {
    if (header.length === 0) {
        throw new Error('input must not be of zero length');
    }

    // Split parts by comma
    const parts = header.split(',');
    const links = {};

    // Parse each part into a named link
    for (let i = 0; i < parts.length; i++) {
        const section = parts[i].split(';');
        if (section.length !== 2) {
            throw new Error('section could not be split on \';\'');
        }
        const url = section[0].replace(/<(.*)>/, '$1').trim();
        const name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
    }
    return links;
}

/**
 * Return all of our milestone data
 *
 * @param {String}   view
 * @param {Function} cb
 */
function getMilestones(view, cb) {
    let query = '?per_page=300&q=';
    let url;
    let result = [];

    // Make sure we are checking the hidden settings of the proper view
    const currentView = view || 'all';

    // Mark our milestones if they are hidden or not
    GistDB.get(`${currentView}.milestones`, (err, gistDataMilestones) => {
        if (err) {
            return;
        }

        function handleData(data, status, xhr) {
            // Combine our data with some of our gist data
            const enhancedData = _.map(data, (item) => {
                const gistDataMilestone = _.findWhere(gistDataMilestones, {id: item.id});
                const percentComplete = item.open_issues || item.closed_issues
                    ? Math.round((item.closed_issues / (item.open_issues + item.closed_issues)) * 100)
                    : 0;
                return {
                    ...item,
                    hidden: gistDataMilestone && gistDataMilestone.hidden,
                    percentComplete,
                };
            });
            result = result.concat(enhancedData);

            // If we have a next link, then we do some recursive pagination
            const responseHeaderLink = xhr.getResponseHeader('Link');
            if (responseHeaderLink) {
                const links = parse_link_header(responseHeaderLink);
                if (links.next) {
                    /* eslint-disable no-use-before-define */
                    makeRequest(links.next);
                    /* eslint-enable no-use-before-define */
                    return;
                }
            }

            // Now put everything in the same order as our gist data
            const orderedResult = [];
            const newUnorderedMilestones = [];
            _.each(result, (m) => {
                const index = _.findIndex(gistDataMilestones, {id: m.id});
                if (index < 0) {
                    newUnorderedMilestones.push(m);
                } else {
                    orderedResult[index] = m;
                }
            });

            result = newUnorderedMilestones.concat(orderedResult);

            cb(null, _.compact(result));
        }

        function makeRequest(overwriteUrl) {
            // Get the open milestones
            query += '+state:open';

            url = `${baseUrl}/repos/expensify/expensify/milestones${query}`;
            $.ajax({
                url: overwriteUrl || url,
                headers: {
                    Authorization: `Bearer ${Preferences.getGitHubToken()}`,
                },
            })
                .done(handleData)
                .fail(cb);
        }

        makeRequest();
    });
}

/**
 * Get all the pull requests where the current user is either assigned
 * or the author
 *
 * @date 2015-06-07
 * @private
 *
 * @param {string} type 'assignee' or 'author'
 * @param {Function} cb [description]
 * @param {Boolean} getReviews wether or not to make extra API requests to get the review data
 */
function getPullsByType(type, cb, getReviews) {
    let query = '?q=';

    // Get the PRs assigned to me
    query += '+state:open';
    query += '+type:pr';

    // query += '+user:expensify';
    query += '+org:expensify';
    query += `+${type}:${getCurrentUser()}`;

    query += '&sort=updated';

    const url = `${baseUrl}/search/issues${query}`;
    $.ajax({
        url,
        headers: {
            Authorization: `Bearer ${Preferences.getGitHubToken()}`,
        },
    })
        .done((data) => {
            const modifiedData = {...data};
            if (!data.items || !data.items.length) {
                return cb(null, []);
            }

            // Filter out closed issues, as the search query does not do this correctly,
            // even though we are specifying `state:open`
            modifiedData.items = _.filter(modifiedData.items, item => item.state === 'open');

            const done = _.after(modifiedData.items.length, () => {
                cb(null, modifiedData.items);
            });

            // Get the detailed PR info for each PR
            _.each(modifiedData.items, (item) => {
                const repoArray = item.repository_url.split('/');
                const owner = repoArray[repoArray.length - 2];
                const repo = repoArray[repoArray.length - 1];
                const url2 = `${baseUrl}/repos/${owner}/${repo}/pulls/${item.number}`;

                // eslint-disable-next-line no-param-reassign
                item.prType = type;

                $.ajax({
                    url: url2,
                    headers: {
                        Authorization: `Bearer ${Preferences.getGitHubToken()}`,
                    },
                }).done((data2) => {
                    // eslint-disable-next-line no-param-reassign
                    item.pr = data2;

                    // Now get the PR check runs
                    $.ajax({
                        url: `${baseUrl}/repos/${owner}/${repo}/commits/${data2.head.sha}/check-runs`,
                        headers: {
                            Authorization: `Bearer ${Preferences.getGitHubToken()}`,
                            Accept: 'application/vnd.github.antiope-preview+json',
                        },
                    }).done((data3) => {
                        // Filter out non-travis check-runs
                        const check_runs = _.filter((data3.check_runs || []), run => run.app.slug === 'travis-ci');
                        const maybeGetReviews = function () {
                            // Stop here if we aren't getting reviewers
                            if (!getReviews) {
                                return done();
                            }

                            // Now get the PR reviews
                            $.ajax({
                                url: `${baseUrl}/repos/${owner}/${repo}/pulls/${item.number}/reviews`,
                                headers: {
                                    Authorization: `Bearer ${Preferences.getGitHubToken()}`,
                                    Accept: 'application/vnd.github.black-cat-preview+json',
                                },
                            }).done((data4) => {
                                // eslint-disable-next-line no-param-reassign
                                item.reviews = data4;
                                const reviewsByUser = _.filter(data4, r => r.user.login === getCurrentUser());
                                const approved = _.findWhere(reviewsByUser, {state: 'APPROVED'});
                                const commented = _.findWhere(reviewsByUser, {state: 'COMMENTED'});
                                const reviewDismissed = _.findWhere(reviewsByUser, {state: 'DISMISSED'});
                                const changesRequested = _.findWhere(reviewsByUser, {state: 'CHANGES_REQUESTED'});
                                // eslint-disable-next-line no-param-reassign
                                item.userIsFinishedReviewing = !reviewDismissed && ((commented && !changesRequested) || approved);
                                return done();
                            });
                        };

                        // If there are no valid Travis check-runs, it is either because
                        // there are no tests running on Travis OR because the repo is using the
                        // older Travis CI OAuth App instead of the new GitHub App. In that case,
                        // try the old statuses url
                        if (check_runs.length === 0) {
                            $.ajax({
                                // eslint-disable-next-line no-underscore-dangle
                                url: data2._links.statuses.href,
                                headers: {
                                    Authorization: `Bearer ${Preferences.getGitHubToken()}`,
                                },
                            }).done((statusesData) => {
                                // Filter out non-travis statuses (i.e. musedev)
                                // eslint-disable-next-line no-param-reassign
                                item.pr.status = _.filter(statusesData, status => status.context === 'continuous-integration/travis-ci/pr');
                                return maybeGetReviews();
                            });
                        } else {
                            // Check-runs endpoint uses .conclusion instead of .state - map it
                            // back to .state in order not to change the view
                            // eslint-disable-next-line no-param-reassign
                            item.pr.status = _.map(check_runs, (status) => {
                                const state = ((status.conclusion ? status.conclusion : status.status) || '').replace(/_/g, ' ');
                                return {state, ...status};
                            });
                            return maybeGetReviews();
                        }
                    });
                });
            });
        })
        .fail((err) => {
            cb(err);
        });
}

/**
 * Get all issues with a certain label
 *
 * @date 2015-06-07
 * @private
 *
 * @param {string} label
 * @param {string} assignee
 * @param {Function} cb
 * @param {Function} retryCb called each time we attempting to retry the API call
 */
function getIssuesByLabel(label, assignee, cb, retryCb) {
    const filterLabels = ['hourly', 'daily', 'weekly', 'monthly'];
    let query = '?per_page=300&q=';
    let result = [];

    // Get the PRs assigned to me
    query += '+state:open';
    query += '+is:issue';
    query += '+repo:Expensify/Expensify';
    query += '+repo:Expensify/App';
    query += '+repo:Expensify/Insiders';
    query += '+repo:Expensify/VendorTasks';
    query += '+repo:Expensify/Expensify-Guides';

    if (assignee === 'none') {
        query += '+no:assignee';
    } else if (assignee) {
        query += `+assignee:${assignee}`;
    }

    // We need to exclude our other filter labels if we are searching
    // for no priority
    if (label === 'none') {
        for (let i = filterLabels.length - 1; i >= 0; i--) {
            query += `+-label:${filterLabels[i]}`;
        }
    } else if (label) {
        query += `+label:${label}`;
    }

    const url = `${baseUrl}/search/issues${query}`;

    function handleData(data, status, xhr) {
        // Set the type of the item to be the label we are looking for
        _.map(data.items, item => ({...item, type: label}));

        result = result.concat(data.items);

        // If we have a next link, then we do some recursive pagination
        const responseHeaderLink = xhr.getResponseHeader('Link');
        if (responseHeaderLink) {
            const links = parse_link_header(responseHeaderLink);
            if (links.next) {
                /* eslint-disable no-use-before-define */
                makeRequest(links.next);
                /* eslint-enable no-use-before-define */
                return;
            }
        }

        cb(null, result);
    }

    function makeRequest(overwriteUrl) {
        $.ajax({
            url: overwriteUrl || url,
            headers: {
                Authorization: `Bearer ${Preferences.getGitHubToken()}`,
            },
        })
            .done(handleData)
            .fail((xhr, err, msg) => {
                if (xhr.status === 403) {
                    const resetTime = new Date(xhr.getResponseHeader('X-RateLimit-Reset') * 1000);
                    const resetInterval = setInterval(() => {
                        if (retryCb) {
                            retryCb(resetTime - new Date());
                        }
                        if (new Date() > resetTime) {
                            clearInterval(resetInterval);
                            makeRequest(overwriteUrl);
                        }
                    }, 1000);
                    return;
                }
                cb(xhr, err, msg);
            });
    }

    makeRequest();
}

/**
 * Get all open issue for a particular area
 * @private
 *
 * @param {string} area
 * @param {Function} cb
 * @param {Function} retryCb called each time we attempting to retry the API call
 */
function getIssuesByArea(area, cb, retryCb) {
    let query = '?per_page=100&q=';
    let url;
    let result = [];

    function handleData(data, status, xhr) {
        // Set the type of the item to be the label we are looking for
        const sortedData = _.chain(data.items)
            .map((item) => {
                const modifiedItem = {...item};
                modifiedItem.type = area;

                const age = moment().diff(item.created_at, 'days');
                const isImprovement = _.findWhere(item.labels, {name: 'Improvement'});
                const isTask = _.findWhere(item.labels, {name: 'Task'});
                const isFeature = _.findWhere(item.labels, {name: 'NewFeature'});
                const isHourly = _.findWhere(item.labels, {name: 'Hourly'});
                const isDaily = _.findWhere(item.labels, {name: 'Daily'});
                const isWeekly = _.findWhere(item.labels, {name: 'Weekly'});
                const isMonthly = _.findWhere(item.labels, {name: 'Monthly'});
                const isFirstPick = _.findWhere(item.labels, {name: 'FirstPick'});
                const isWhatsNext = _.findWhere(item.labels, {name: 'WhatsNext'});
                let score = 0;

                // Sort by K2
                score += isHourly ? 10000000 : 0;
                score += isDaily ? 1000000 : 0;
                score += isWeekly ? 100000 : 0;
                score += isMonthly ? 10000 : 0;

                // WhatsNext issues should be at the top of each KSV2 group
                score += isWhatsNext ? 9000 : 0;

                // First picks go above improvements
                score += isFirstPick ? 1050 : 0;

                // All improvements are at the top, followed by tasks, followed by features
                score += isImprovement ? 1000 : 0;
                score += isTask ? 500 : 0;
                score += isFeature ? 500 : 0;

                // Sort by age too
                score += age / 100;

                modifiedItem.score = score;
                modifiedItem.age = age;
                return modifiedItem;
            })
            .sortBy('score')
            .value();
        result = result.concat(sortedData);

        // If we have a next link, then we do some recursive pagination
        const responseHeaderLink = xhr.getResponseHeader('Link');
        if (responseHeaderLink) {
            const links = parse_link_header(responseHeaderLink);
            if (links.next) {
                /* eslint-disable no-use-before-define */
                makeRequest(links.next);
                /* eslint-enable no-use-before-define */
                return;
            }
        }

        cb(null, _.sortBy(result, 'score').reverse());
    }

    function makeRequest(overwriteUrl) {
    // Get the PRs assigned to me
        query += '+state:open';
        query += '+is:issue';

        // query += '+user:expensify';
        query += `+label:${area}`;
        query += '+no:assignee';
        query += '+repo:Expensify/Expensify';
        query += '+repo:Expensify/App';
        query += '+repo:Expensify/VendorTasks';
        query += '+repo:Expensify/Insiders';
        query += '+repo:Expensify/Expensify-Guides';
        query += '&page=1';

        url = `${baseUrl}/search/issues${query}`;
        $.ajax({
            url: overwriteUrl || url,
            headers: {
                Authorization: `Bearer ${Preferences.getGitHubToken()}`,
            },
        })
            .done(handleData)
            .fail((xhr, err, msg) => {
                if (xhr.status === 403) {
                    const resetTime = new Date(xhr.getResponseHeader('X-RateLimit-Reset') * 1000);
                    const resetInterval = setInterval(() => {
                        retryCb(resetTime - new Date());
                        if (new Date() > resetTime) {
                            clearInterval(resetInterval);
                            makeRequest(overwriteUrl);
                        }
                    }, 1000);
                    return;
                }
                cb(xhr, err, msg);
            });
    }

    makeRequest();
}

/**
 * Add labels to a github issue
 * @param {String[]} labels
 * @param {Function} [cb]
 */
function addLabels(labels, cb) {
    const repo = getRepo();
    const owner = getOwner();
    const issueNum = $('.gh-header-number').first().text().replace('#', '');
    const url = `${baseUrl}/repos/${owner}/${repo}/issues/${issueNum}/labels`;
    $.ajax({
        url,
        method: 'post',
        data: JSON.stringify(labels),
        headers: {
            Authorization: `Bearer ${Preferences.getGitHubToken()}`,
        },
    })
        .done((data) => {
            if (!cb) {
                return;
            }
            cb(null, data);
        })
        .fail((err) => {
            if (!cb) {
                return;
            }
            cb(err);
        });
}

/**
 * Remove a label from a github issue
 * @param {String} label
 * @param {Function} [cb]
 * @param {Number} [issueNumber] an issue number to use if we don't want to default to the currently open issue
 * @param {String} [repoName] a repository to use if we don't want to use the one on the current page
 */
function removeLabel(label, cb, issueNumber, repoName) {
    const repo = repoName || getRepo();
    const owner = getOwner();
    const issueNum = issueNumber || $('.gh-header-number').first().text().replace('#', '');
    const url = `${baseUrl}/repos/${owner}/${repo}/issues/${issueNum}/labels/${label}`;
    $.ajax({
        url,
        method: 'delete',
        headers: {
            Authorization: `Bearer ${Preferences.getGitHubToken()}`,
        },
    })
        .done((data) => {
            if (!cb) {
                return;
            }
            cb(null, data);
        })
        .fail((err) => {
            if (!cb) {
                return;
            }
            cb(err);
        });
}

/**
 * Gets all issues assigned to someone
 *
 * @param {Function} cb
 * @param {Function} retryCb
 */
function getAllAssigned(cb, retryCb) {
    getIssuesByLabel(null, getCurrentUser(), cb, retryCb);
}

/**
 * Gets all issues not assigned to anyone
 *
 * @param {Function} cb
 * @param {Function} retryCb
 */
function getAllUnassigned(cb, retryCb) {
    getIssuesByLabel(null, 'none', cb, retryCb);
}

/**
 * Gets the issues for web that are open and should be worked on
 *
 * @param {Function} cb
 * @param {Function} retryCb called each time we attempting to retry the API call
 */
function getEngineeringIssues(cb, retryCb) {
    getIssuesByArea('engineering', cb, retryCb);
}

/**
 * Gets the issues for integrations that are open and should be worked on
 *
 * @param {Function} cb
 * @param {Function} retryCb called each time we attempting to retry the API call
 */
function getIntegrationsIssues(cb, retryCb) {
    getIssuesByArea('"integration+server"', cb, retryCb);
}

/**
 * Get all the pull requests assigned to the current user
 *
 * @date 2015-06-07
 *
 * @param {Function} cb [description]
 */
function getPullsAssigned(cb) {
    getPullsByType('assignee', cb, true);
}

/**
 * Get all the pull requests the user is currently reviewing
 *
 * @date 2015-06-07
 *
 * @param {Function} cb [description]
 */
function getPullsReviewing(cb) {
    let result = [];
    const done = _.after(2, () => {
        cb(null, _.chain(result)
            .filter((pr) => {
                // If there is no assignee, ensure reviewers still see the PR so it does not get lost
                if (!pr.assignee) {
                    return true;
                }
                return pr.assignee.login !== getCurrentUser();
            })
            .sortBy('userIsFinishedReviewing')
            .value()
            .reverse());
    });

    getPullsByType('review-requested', (err, data) => {
        if (err) {
            console.error(err);
            done();
            return;
        }
        result = result.concat(data);
        done();
    }, true);

    getPullsByType('reviewed-by', (err, data) => {
        if (err) {
            console.error(err);
            done();
            return;
        }
        result = result.concat(data);
        done();
    }, true);
}

/**
 * Get all the pull requests assigned to the current user
 *
 * @date 2015-06-07
 *
 * @param {Function} cb
 */
function getPullsAuthored(cb) {
    getPullsByType('author', cb);
}

/**
 * Get all the improvements that are not assigned and are dailys
 *
 * @date 2015-06-07
 *
 * @param {Function} cb
 */
function getDailyImprovements(cb) {
    let query = '?q=';

    // Get all the open issues with no assignees
    query += '+state:open';
    query += '+is:issue';
    query += '+repo:Expensify/Expensify';
    query += '+repo:Expensify/App';
    query += '+repo:Expensify/VendorTasks';
    query += '+repo:Expensify/Insiders';
    query += '+repo:Expensify/Expensify-Guides';
    query += '+no:assignee';
    query += '+label:improvement';
    query += '+label:daily';

    const url = `${baseUrl}/search/issues${query}`;
    $.ajax({
        url,
        headers: {
            Authorization: `Bearer ${Preferences.getGitHubToken()}`,
        },
    })
        .done((data) => {
            cb(null, data.items);
        })
        .fail((err) => {
            console.error(err);
            cb(err);
        });
}

export {
    getEngineeringIssues,
    getIntegrationsIssues,
    getAllAssigned,
    getAllUnassigned,
    getPullsAssigned,
    getPullsReviewing,
    getPullsAuthored,
    getDailyImprovements,
    addLabels,
    removeLabel,
    getMilestones,
    getCurrentUser,
};
