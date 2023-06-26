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
    const currentUser = params.get('currentUser') ? params.get('currentUser') : $('meta[name=user-login]').attr('content');
    return currentUser.replace('@', '');
}

/**
 * Returns the name of the repository, the repo owner and the issue number from the current url for calls to the Github API
 * Issue URLs are in the format: github.com/<repoName>/<owner>/issues/<issue-number> Example: https://github.com/Expensify/App/issues/16640
 * PR URLs are in the format: github.com/<repoName>/<owner>/pulls/<issue-number> Example: https://github.com/Expensify/App/pull/21242
 *
 * @returns {Object}
 */
function getRequestParams() {
    const url = window.location.href;
    const regex = /github.com\/(\w*)\/(\w*)\/(?:issues|pull)\/(\d*)/;
    const matches = url.match(regex);

    return {
        owner: matches[1],
        repo: matches[2],
        issue_number: matches[3],
    };
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
 * A utility method that will run a graphql query and keep paginating the results until
 * there are no more results to get. This should automatically apply all of GH's best practices
 * to avoid hitting rate limits.
 *
 * @param {String} query
 * @returns {Promise<Array>}
 */
function getFullResultsUsingPagination(query) {
    return new Promise((resolve) => {
        let results = [];

        // This does all the pagination on the graphQL query
        function fetchPageOfIssues(cursor) {
            getOctokit().graphql(query, {cursor})
                .then((queryResults) => {
                    results = results.concat(queryResults.search.nodes);

                    // When there is another page, this function needs to be called recursively to get the next page
                    if (queryResults.search.pageInfo.hasNextPage) {
                        fetchPageOfIssues(queryResults.search.pageInfo.endCursor);
                        return;
                    }

                    // When there are no more pages, then we can resolve the final promise with all our results
                    resolve(results);
                });
        }
        fetchPageOfIssues();
    });
}

/**
 * A utility method that takes the raw GraphQL query results for issues and turns it into a format that
 * the rest of the app can use. This removes things like "edges" and "nodes" from the data.
 *
 * @param {Array<Object>}rawIssueData
 * @returns {Object}
 */
function formatIssueResults(rawIssueData) {
    const cleanData = _.reduce(rawIssueData, (cleanSearchResults, searchNode) => {
        cleanSearchResults.push({
            ...searchNode,
            labels: _.reduce(searchNode.labels.nodes, (cleanLabels, labelNode) => {
                cleanLabels.push({
                    ...labelNode,
                });
                return cleanLabels;
            }, []),
            assignees: _.reduce(searchNode.assignees.nodes, (cleanAssignees, assigneeNode) => {
                cleanAssignees.push({
                    ...assigneeNode,
                });
                return cleanAssignees;
            }, []),
        });
        return cleanSearchResults;
    }, []);

    // Index the results by ID so that they can be accessed as a collection easier
    return _.indexBy(cleanData, 'id');
}

function getWAQIssues() {
    let query = '';
    query += ' state:open';
    query += ' type:issue';
    query += ' repo:Expensify/App';
    query += ' label:Bug';
    query += ' NOT hold in:title';
    query += ' -label:Reviewing';

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
                        updatedAt
                        assignees(first: 100) {
                          nodes {
                            avatarUrl
                            login
                          }
                        }
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

    return getFullResultsUsingPagination(graphQLQuery)
        .then(formatIssueResults);
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
                assignees(first:1) {
                    nodes {
                        login
                    }
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
        owner: getRequestParams().owner,
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
function getIssues(assignee = 'none', labels) {
    let query = '';

    // Get the PRs assigned to me
    query += ' state:open';
    query += ' is:issue';

    if (labels && labels.length) {
        for (let i = 0; i < labels.length; i++) {
            query += ` label:${labels[i]}`;
        }
    }

    query += ' repo:Expensify/Expensify';
    query += ' repo:Expensify/App';
    query += ' repo:Expensify/VendorTasks';
    query += ' repo:Expensify/Insiders';
    query += ' repo:Expensify/Expensify-Guides';
    query += ' repo:Expensify/react-native-onyx';

    if (assignee === 'none') {
        query += ' no:assignee';
    } else if (assignee) {
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
                        updatedAt
                        assignees(first: 100) {
                          nodes {
                            avatarUrl
                            login
                          }
                        }
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

    return getFullResultsUsingPagination(graphQLQuery)
        .then(formatIssueResults);
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
    return getOctokit().rest.issues.addLabels({...getRequestParams(), labels: [label]});
}

/**
 * Remove a label from a github issue
 * @param {String} label
 * @returns {Promise}
 */
function removeLabel(label) {
    return getOctokit().rest.issues.removeLabel({...getRequestParams(), name: label});
}

/**
 * @returns {Promise}
 */
function getDailyImprovements() {
    return getIssues('none', ['improvement', 'daily']);
}

/**
 * @param {String} comment
 * @returns {Promise}
 */
function addComment(comment) {
    return getOctokit().rest.issues.createComment({...getRequestParams(), body: comment});
}

export {
    addComment,
    getCheckRuns,
    getEngineeringIssues,
    getIssuesAssigned,
    getDailyImprovements,
    getWAQIssues,
    addLabel,
    removeLabel,
    getMilestones,
    getCurrentUser,
    getPullsByType,
};
