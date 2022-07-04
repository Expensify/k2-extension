import $ from 'jquery';
import _ from 'underscore';
import moment from 'moment';
import {Octokit} from 'octokit';
import * as Preferences from './actions/Preferences';

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
 * @returns {Promise}
 */
function getMilestones() {
    const octokit = new Octokit({auth: Preferences.getGitHubToken()});
    const graphQLQuery = `
{
    repository(name: "expensify", owner: "expensify") {
        milestones(first: 100, states: OPEN) {
            edges {
                node {
                    title
                    id
                }
            }
        }
    }
}
    `;

    return octokit.graphql(graphQLQuery)
        .then((data) => {
            // Put the data into a format that the rest of the app will use to remove things like edges and nodes
            const results = _.reduce(data.repository.milestones.edges, (milestones, milestonesEdge) => {
                milestones.push({
                    ...milestonesEdge.node,
                });
                return milestones;
            }, []);

            // Index the results by their ID so they are easier to access as a collection
            return _.indexBy(results, 'id');
        });
}

/**
 * Get all the pull requests where the current user is either assigned
 * or the author
 *
 * @param {string} type 'assignee' or 'author'
 * @returns {Promise}
 */
function getPullsByType(type) {
    let query = '';

    // Get the PRs assigned to me
    query += ' state:open';
    query += ' type:pr';

    query += ' org:expensify';
    query += ` ${type}:${getCurrentUser()}`;

    const octokit = new Octokit({auth: Preferences.getGitHubToken()});

    const graphQLQuery = `
query {
    search(query: "${query}", type: ISSUE, first: 100) {
        edges {
            node {
                ... on PullRequest {
                    headRefOid
                    id
                    isDraft
                    mergeable
                    reviewDecision
                    title
                    url
                    updatedAt
                    author {
                        login
                    }
                    comments {
                        totalCount
                    }
                    repository {
                        name
                    }
                    reviews {
                        totalCount
                    }
                }
            }
        }
    }
}
    `;

    return octokit.graphql(graphQLQuery)
        .then((data) => {
            // Put the data into a format that the rest of the app will use to remove things like edges and nodes
            const results = _.reduce(data.search.edges, (pullRequests, searchEdge) => {
                pullRequests.push({
                    ...searchEdge.node,
                });
                return pullRequests;
            }, []);

            // Index the results by their ID so they are easier to access as a collection
            return _.indexBy(results, 'id');
        });
}

function getCheckRuns(repo, headSHA) {
    const octokit = new Octokit({auth: Preferences.getGitHubToken()});
    return octokit.rest.checks.listForRef({
        owner: getOwner(),
        repo,
        ref: headSHA,
    });
}

/**
 * Get all issues assigned to the current user
 *
 * @returns {Promise}
 */
function getIssuesAssigned() {
    let query = '';

    // Get the PRs assigned to me
    query += ' state:open';
    query += ' is:issue';
    query += ' repo:Expensify/Expensify';
    query += ' repo:Expensify/App';
    query += ' repo:Expensify/Insiders';
    query += ' repo:Expensify/VendorTasks';
    query += ' repo:Expensify/Expensify-Guides';

    const assignee = getCurrentUser();

    if (assignee === 'none') {
        query += ' no:assignee';
    } else if (assignee) {
        query += ` assignee:${assignee}`;
    }

    const octokit = new Octokit({auth: Preferences.getGitHubToken()});

    return octokit.graphql(`
        query {
            search(
                query: "${query}"
                type: ISSUE
                first: 100
            ) {
                edges {
                    node {
                        ... on Issue {
                            title
                            id
                            url
                            labels(first: 100) {
                                edges {
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    `)
        .then((data) => {
            // Put the data into a format that the rest of the app will use to remove things like edges and nodes
            const results = _.reduce(data.search.edges, (finalResults, searchEdge) => {
                finalResults.push({
                    ...searchEdge.node,
                    labels: _.reduce(searchEdge.node.labels.edges, (finalLabels, labelEdge) => {
                        finalLabels.push({
                            ...labelEdge.node,
                        });
                        return finalLabels;
                    }, []),
                });
                return finalResults;
            }, []);

            // Index the results by their ID so they are easier to access as a collection
            return _.indexBy(results, 'id');
        });
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
            cb(null, _.map(data.items, item => ({...item, url: item.html_url})));
        })
        .fail((err) => {
            console.error(err);
            cb(err);
        });
}

export {
    getCheckRuns,
    getEngineeringIssues,
    getIntegrationsIssues,
    getIssuesAssigned,
    getDailyImprovements,
    addLabels,
    removeLabel,
    getMilestones,
    getCurrentUser,
    getPullsByType,
};
