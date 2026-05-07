import $ from 'jquery';
import _ from 'underscore';
import {Octokit} from 'octokit';
import * as Preferences from './actions/Preferences';
import * as RateLimitMonitor from './RateLimitMonitor';
import * as CacheManager from './CacheManager';

let octokit;

/**
 * @returns {Octokit}
 */
function getOctokit() {
    if (!octokit) {
        /* eslint-disable-next-line no-console */
        console.log(
            'authenticate with auth token',
            Preferences.getGitHubToken(),
        );
        octokit = new Octokit({
            auth: Preferences.getGitHubToken(),
            userAgent: 'expensify-k2-extension',
        });

        // Hook into all responses to track rate limit headers
        octokit.hook.after('request', (response) => {
            if (!response || !response.headers) {
                return;
            }
            RateLimitMonitor.updateFromHeaders(response.headers);
        });
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
    const currentUser = params.get('currentUser')
        ? params.get('currentUser')
        : $('meta[name=user-login]').attr('content');
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
    const regex = /github.com\/(?<owner>\w*)\/(?<repo>\w*)(?:\/(?:issues|pull)\/(?<issue_number>\d*))?/;
    const matches = url.match(regex);

    return {
        owner: (matches && matches.groups && matches.groups.owner) || '',
        repo: (matches && matches.groups && matches.groups.repo) || '',
        issue_number:
            (matches && matches.groups && matches.groups.issue_number) || '',
    };
}

/**
 * Return all of our milestone data
 * Results are cached for 5 minutes since milestones rarely change.
 *
 * @returns {Promise}
 */
async function getMilestones() {
    const cacheKey = 'graphql:milestones';

    // Check cache first
    const cached = await CacheManager.get(cacheKey);
    if (cached) {
        return cached.data;
    }

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

    return getOctokit()
        .graphql(graphQLQuery)
        .then((data) => {
            // Put the data into a format that the rest of the app will use to remove things like edges and nodes
            const results = _.reduce(
                data.repository.milestones.nodes,
                (milestones, milestonesNode) => {
                    milestones.push({
                        ...milestonesNode,
                    });
                    return milestones;
                },
                [],
            );

            // Index the results by their ID so they are easier to access as a collection
            const indexedResults = _.indexBy(results, 'id');

            // Cache for 5 minutes (milestones rarely change)
            CacheManager.set(
                cacheKey,
                indexedResults,
                null,
                CacheManager.TTL.LONG,
            );

            return indexedResults;
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
            getOctokit()
                .graphql(query, {cursor})
                .then((queryResults) => {
                    results = results.concat(queryResults.search.nodes);

                    // When there is another page, this function needs to be called recursively to get the next page
                    if (queryResults.search.pageInfo.hasNextPage) {
                        fetchPageOfIssues(
                            queryResults.search.pageInfo.endCursor,
                        );
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
    const cleanData = _.reduce(
        rawIssueData,
        (cleanSearchResults, searchNode) => {
            cleanSearchResults.push({
                ...searchNode,
                labels: _.reduce(
                    searchNode.labels.nodes,
                    (cleanLabels, labelNode) => {
                        cleanLabels.push({
                            ...labelNode,
                        });
                        return cleanLabels;
                    },
                    [],
                ),
                assignees: _.reduce(
                    searchNode.assignees.nodes,
                    (cleanAssignees, assigneeNode) => {
                        cleanAssignees.push({
                            ...assigneeNode,
                        });
                        return cleanAssignees;
                    },
                    [],
                ),
            });
            return cleanSearchResults;
        },
        [],
    );

    // Index the results by ID so that they can be accessed as a collection easier
    return _.indexBy(cleanData, 'id');
}

function getHotPickIssues() {
    let query = '';
    query += ' state:open';
    query += ' type:issue';
    query += ' repo:Expensify/App';
    query += ' repo:Expensify/Expensify';
    query += ' NOT hold in:title';
    query += ' label:\\"Hot Pick\\"';

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

    return getFullResultsUsingPagination(graphQLQuery).then(formatIssueResults);
}

/**
 * Get all the pull requests where the current user is either assigned
 * or the author. Results are cached for 2 minutes.
 *
 * @param {string} type 'assignee' or 'author'
 * @returns {Promise}
 */
async function getPullsByType(type) {
    const user = getCurrentUser();
    const cacheKey = `graphql:pulls:${type}:${user}`;

    // Check cache first
    const cached = await CacheManager.get(cacheKey);
    if (cached) {
        return cached.data;
    }

    let query = '';
    query += ' state:open';
    query += ' type:pr';

    query += ' org:expensify';
    query += ` ${type}:${user}`;

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
                commits(last: 1) {
                    nodes {
                        commit {
                            statusCheckRollup {
                                state
                            }
                        }
                    }
                }
            }
        }
    }
}
    `;

    return getOctokit()
        .graphql(graphQLQuery)
        .then((data) => {
            // Put the data into a format that the rest of the app will use to remove things like edges and nodes
            const results = _.reduce(
                data.search.nodes,
                (pullRequests, searchNodes) => {
                    pullRequests.push({
                        ...searchNodes,
                    });
                    return pullRequests;
                },
                [],
            );

            // Index the results by their ID so they are easier to access as a collection
            const indexedResults = _.indexBy(results, 'id');

            // Cache for 2 minutes
            CacheManager.set(
                cacheKey,
                indexedResults,
                null,
                CacheManager.TTL.MEDIUM,
            );

            return indexedResults;
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
function getIssues(assignee = 'none', labels = []) {
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
                        body
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
                        comments(last: 15) {
                            nodes {
                                body
                                createdAt
                                author {
                                    login
                                    avatarUrl
                                }
                            }
                            totalCount
                        } 
                    }
                }
            }
        }
    `;

    return getFullResultsUsingPagination(graphQLQuery).then(formatIssueResults);
}

/**
 * Get previous instance of issue - used by accounting team to find the previous issue for the currently open chore
 *
 * @param {String[]} titleParts
 * @returns {Promise}
 */
function getPreviousInstancesOfIssue(titleParts) {
    let query = '';
    query += ' state:closed';
    query += ' type:issue';
    query += ' repo:Expensify/Insiders';
    query += ' repo:Expensify/Expensify';

    for (let i = 0; i < titleParts.length; i++) {
        query += ` '${titleParts[i]}' in:title`;
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
                            title
                        }
                    }
                }
            }
        }
    `;

    return getFullResultsUsingPagination(graphQLQuery).then(formatIssueResults);
}

/**
 * Get all open issues that mention the current user and they haven't replied to
 *
 * @returns {Promise}
 */
function getIssuesMentioning() {
    const currentUser = getCurrentUser();
    let query = '';
    query += ' state:open';
    query += ' is:issue';
    query += ` mentions:${currentUser}`;
    query += ' org:Expensify';

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
                        body
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
                        comments(last: 30) {
                            nodes {
                                body
                                createdAt
                                author {
                                    login
                                    avatarUrl
                                }
                            }
                            totalCount
                        }
                    }
                }
            }
        }
    `;

    return getFullResultsUsingPagination(graphQLQuery)
        .then(formatIssueResults)
        .then((issues) => {
            const issuesToFilter = _.filter(issues, (issue) => {
                const comments = issue.comments.nodes;

                // Find the last comment that mentions the current user
                const lastMentionIndex = _.reduce(
                    comments,
                    (foundIndex, comment, index) => {
                        if (
                            comment.body
                            && comment.body.includes(`@${currentUser}`)
                            && comment.author.login !== currentUser
                        ) {
                            return index;
                        }
                        return foundIndex;
                    },
                    -1,
                );

                // No mention found in recent comments — skip this issue
                if (lastMentionIndex === -1) {
                    return false;
                }

                // Check if the user has replied after the last mention
                const hasRepliedSince = _.some(
                    comments.slice(lastMentionIndex + 1),
                    comment => comment.author.login === currentUser,
                );
                return !hasRepliedSince;
            });
            return _.indexBy(issuesToFilter, 'id');
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
        ...getRequestParams(),
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
        ...getRequestParams(),
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
 * @param {String} comment
 * @returns {Promise}
 */
function addComment(comment) {
    return getOctokit().rest.issues.createComment({
        ...getRequestParams(),
        body: comment,
    });
}

/**
 * @returns {Promise}
 */
function getCurrentIssueDescription() {
    return getOctokit().rest.issues.get({...getRequestParams()});
}

/**
 * @param {String} body
 * @returns {Promise}
 */
function setCurrentIssueBody(body) {
    return getOctokit().rest.issues.update({...getRequestParams(), body});
}

/**
 * @param {String} workflowId
 * @param {Object} [options]
 * @param {String} [options.owner] - Repo owner. Defaults to the owner parsed from the current page URL.
 * @param {String} [options.repo] - Repo name. Defaults to the repo parsed from the current page URL.
 * @param {String} [options.ref] - Git ref to dispatch against. Defaults to 'main'.
 * @param {Object} [options.inputs] - Workflow inputs. Defaults to {PULL_REQUEST_URL} for the current PR.
 * @returns {Promise}
 */
function triggerWorkflow(workflowId, options = {}) {
    const params = getRequestParams();
    const owner = options.owner || params.owner;
    const repo = options.repo || params.repo;
    const ref = options.ref || 'main';
    const inputs = options.inputs || {
        PULL_REQUEST_URL: `https://github.com/${owner}/${repo}/pull/${params.issue_number}`,
    };
    return getOctokit().rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowId,
        ref,
        inputs,
    });
}

/**
 * Update an existing comment
 * @param {Number} commentId
 * @param {String} body
 * @returns {Promise}
 */
function updateComment(commentId, body) {
    const {owner, repo} = getRequestParams();
    return getOctokit().rest.issues.updateComment({
        owner,
        repo,
        comment_id: commentId,
        body,
    });
}

/**
 * Get recent workflow runs for a specific workflow
 * @param {String} workflowId
 * @param {Number} perPage
 * @returns {Promise}
 */
function getWorkflowRuns(workflowId, perPage = 5) {
    const {owner, repo} = getRequestParams();
    return getOctokit().rest.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowId,
        per_page: perPage,
    });
}

/**
 * Get a specific workflow run
 * @param {Number} runId
 * @returns {Promise}
 */
function getWorkflowRun(runId) {
    const {owner, repo} = getRequestParams();
    return getOctokit().rest.actions.getWorkflowRun({
        owner,
        repo,
        run_id: runId,
    });
}

/**
 * The private Expensify/Expensify repo URL (for employees)
 */
const PRIVATE_K2_REPO = '/Expensify/Expensify';

/**
 * The public Expensify/App repo URL (for external contributors)
 */
const PUBLIC_K2_REPO = '/Expensify/App';

/**
 * Checks if the current user has access to the private Expensify/Expensify repository.
 * Results are cached in preferences to avoid repeated API calls.
 *
 * @returns {Promise<String>} - The K2 repo URL path ('/Expensify/Expensify' or '/Expensify/App')
 */
async function checkK2RepoAccess() {
    // Check if we already have a cached result
    const cachedUrl = Preferences.getK2RepoUrl();
    if (cachedUrl) {
        return cachedUrl;
    }

    try {
        // Try to access the private repo - this is a lightweight API call
        await getOctokit().rest.repos.get({
            owner: 'Expensify',
            repo: 'Expensify',
        });

        // User has access to the private repo
        Preferences.setK2RepoUrl(PRIVATE_K2_REPO);
        return PRIVATE_K2_REPO;
    } catch (error) {
        // User doesn't have access (403 or 404) - use public App repo
        Preferences.setK2RepoUrl(PUBLIC_K2_REPO);
        return PUBLIC_K2_REPO;
    }
}

export {
    addComment,
    getCheckRuns,
    getEngineeringIssues,
    getIssuesAssigned,
    getDailyImprovements,
    getHotPickIssues,
    addLabel,
    removeLabel,
    getMilestones,
    getCurrentUser,
    getPullsByType,
    getCurrentIssueDescription,
    setCurrentIssueBody,
    getPreviousInstancesOfIssue,
    triggerWorkflow,
    updateComment,
    getWorkflowRuns,
    getWorkflowRun,
    checkK2RepoAccess,
    getIssuesMentioning,
};
