import $ from 'jquery';
import _ from 'underscore';
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
 * Get all open issue for a particular area depending on who is assigned and what label it has
 *
 * @param {String} assignee
 * @param {String} [label]
 * @returns {Promise}
 */
function getIssues(assignee = 'none', label) {
    let query = '';

    // Get the PRs assigned to me
    query += ' state:open';
    query += ' is:issue';

    if (label) {
        query += ` label:${label}`;
    }
    query += ' repo:Expensify/Expensify';
    query += ' repo:Expensify/App';
    query += ' repo:Expensify/VendorTasks';
    query += ' repo:Expensify/Insiders';
    query += ' repo:Expensify/Expensify-Guides';

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
 * Get all issues assigned to the current user
 *
 * @returns {Promise}
 */
function getIssuesAssigned() {
    return getIssues(getCurrentUser());
}

/**
 * Get all unassigned engineering issues
 *
 * @returns {Promise}
 */
function getEngineeringIssues() {
    return getIssues('none', 'engineering');
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
    getIssuesAssigned,
    getDailyImprovements,
    addLabels,
    removeLabel,
    getMilestones,
    getCurrentUser,
    getPullsByType,
};
