import $ from 'jquery';
import _ from 'underscore';
import {Octokit} from 'octokit';
import * as Preferences from './actions/Preferences';

let octokit;

/**
 * @returns {Octokit}
 */
function getOctokit() {
    if (!octokit) {
        octokit = new Octokit({auth: Preferences.getGitHubToken()});
    }
    return octokit;
}

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
 * Returns the issue number that is read off the DOM
 *
 * @returns {String}
 */
function getIssueNumber() {
    return $('.gh-header-number').first().text().replace('#', '');
}

/**
 * Return all of our milestone data
 *
 * @returns {Promise}
 */
function getMilestones() {
    const graphQLQuery = `
{
    repository(name: "expensify", owner: "expensify") {
        milestones(first: 100, states: OPEN) {
            nodes {
                title
                id
            }
        }
    }
}
    `;

    return getOctokit().graphql(graphQLQuery)
        .then((data) => {
            // Put the data into a format that the rest of the app will use to remove things like edges and nodes
            const results = _.reduce(data.repository.milestones.nodes, (milestones, milestonesNode) => {
                milestones.push({
                    ...milestonesNode,
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

    const graphQLQuery = `
query {
    search(query: "${query}", type: ISSUE, first: 100) {
        nodes {
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
    `;

    return getOctokit().graphql(graphQLQuery)
        .then((data) => {
            // Put the data into a format that the rest of the app will use to remove things like edges and nodes
            const results = _.reduce(data.search.nodes, (pullRequests, searchNodes) => {
                pullRequests.push({
                    ...searchNodes,
                });
                return pullRequests;
            }, []);

            // Index the results by their ID so they are easier to access as a collection
            return _.indexBy(results, 'id');
        });
}

function getCheckRuns(repo, headSHA) {
    return getOctokit().rest.checks.listForRef({
        owner: getOwner(),
        repo,
        ref: headSHA,
    });
}

/**
 * Get all open issue for a particular area depending on who is assigned and what label it has
 *
 * @param {String} assignee
 * @param {String[]} [labels]
 * @returns {Promise}
 */
function getIssues(assignee = 'none', labels, getOpenIssues = true) {
    let query = '';

    // Get the PRs assigned to me
    if (getOpenIssues) {
        query += ' state:open';
    }
    query += ' is:issue';

    if (labels && labels.length) {
        for (let i = 0; i < labels.length; i++) {
            query += ` label:\\"${labels[i]}\\"`;
        }
    }

    query += ' repo:Expensify/Expensify';
    query += ' repo:Expensify/App';
    query += ' repo:Expensify/VendorTasks';
    query += ' repo:Expensify/Insiders';
    query += ' repo:Expensify/Expensify-Guides';

    if (assignee === 'none') {
        query += ' no:assignee';
    } else if (assignee !== 'anyone') {
        query += ` assignee:${assignee}`;
    }

    const graphQLQuery = `
        query($cursor:String) {
            search(
                query: "${query}"
                type: ISSUE
                first: 100
                after:$cursor
            ) {
                pageInfo {
                    endCursor
                    hasNextPage
                }
                nodes {
                    ... on Issue {
                        title
                        id
                        url
                        createdAt
                        labels(first: 100) {
                            nodes {
                                name
                            }
                        }
                        milestone {
                            id
                        }
                    }
                }
            }
        }
    `;

    return new Promise((resolve) => {
        const results = [];

        // This does all the pagination on the graphQL query
        function fetchPageOfIssues(cursor) {
            getOctokit().graphql(graphQLQuery, {cursor})
                .then((queryResults) => {
                    // Put the data into a format that the rest of the app will use to remove things like edges and nodes
                    const searchResults = _.reduce(queryResults.search.nodes, (cleanSearchResults, searchNode) => {
                        cleanSearchResults.push({
                            ...searchNode,
                            labels: _.reduce(searchNode.labels.nodes, (cleanLabels, labelNode) => {
                                cleanLabels.push({
                                    ...labelNode,
                                });
                                return cleanLabels;
                            }, []),
                        });
                        return cleanSearchResults;
                    }, []);

                    results.push(...searchResults);

                    // When there is another page, this function needs to be called recursively
                    if (queryResults.search.pageInfo.hasNextPage) {
                        fetchPageOfIssues(queryResults.search.pageInfo.endCursor);
                        return;
                    }

                    // When there are no more pages, then we can resolve the final promise with all our results
                    // indexed by ID so that they can be accessed in the collection easier
                    resolve(_.indexBy(results, 'id'));
                });
        }
        fetchPageOfIssues();
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
    return getIssues('none', ['engineering']);
}

/**
 * Add labels to a github issue
 * @param {String} label
 * @returns {Promise}
 */
function addLabel(label) {
    return getOctokit().rest.issues.addLabels({
        repo: getRepo(),
        owner: getOwner(),
        issue_number: getIssueNumber(),
        labels: [label],
    });
}

/**
 * Remove a label from a github issue
 * @param {String} label
 * @returns {Promise}
 */
function removeLabel(label) {
    return getOctokit().rest.issues.removeLabel({
        repo: getRepo(),
        owner: getOwner(),
        issue_number: getIssueNumber(),
        name: label,
    });
}

/**
 * @returns {Promise}
 */
function getDailyImprovements() {
    return getIssues('none', ['improvement', 'daily']);
}

/**
 * @returns {Promise}
 */
function getOverdueIssueMeetings() {
    return getIssues('anyone', ['Overdue Issue Meeting'], false);
}

export {
    getCheckRuns,
    getEngineeringIssues,
    getIssuesAssigned,
    getDailyImprovements,
    addLabel,
    removeLabel,
    getMilestones,
    getCurrentUser,
    getPullsByType,
    getOverdueIssueMeetings,
};
