import $ from 'jquery';
import _ from 'underscore';
import {Octokit} from 'octokit';
import * as Preferences from './actions/Preferences';
import * as RateLimitMonitor from './RateLimitMonitor';
import * as CacheManager from './CacheManager';
import * as GitHubOAuth from './GitHubOAuth';

/**
 * Custom Octokit auth strategy that resolves the token at request time instead
 * of baking it into the instance at construction. The hook receives the bare
 * inner request function, so retrying inside it does NOT re-run any auth hooks
 * (avoiding stale-token contamination), and we can await a token refresh before
 * the request is sent.
 *
 * @returns {Function} auth function with a `hook` property (Octokit authStrategy contract)
 */
function createDynamicAuth() {
    const auth = async () => ({
        type: 'token',
        tokenType: 'oauth',
        token: Preferences.getGitHubToken() || '',
    });

    auth.hook = async (request, route, parameters) => {
        // Proactively refresh the OAuth token when it's expired or about to
        // expire, so requests rarely ever see a 401
        await GitHubOAuth.refreshIfNeeded();

        const endpoint = request.endpoint.merge(route, parameters);

        // getGitHubToken() returns the OAuth token when present and valid, and
        // falls back to a legacy Personal Access Token otherwise
        const tokenUsed = Preferences.getGitHubToken();
        if (tokenUsed) {
            endpoint.headers.authorization = `token ${tokenUsed}`;
        }

        try {
            return await request(endpoint);
        } catch (error) {
            if (error.status !== 401) {
                throw error;
            }

            const shouldClearOAuthAuth = Preferences.getAuthType() === 'oauth';

            const clearOAuthAuthAndThrow = async () => {
                if (shouldClearOAuthAuth) {
                    await GitHubOAuth.clearOAuthAuth();
                }
                throw error;
            };

            let retryToken = Preferences.getGitHubToken();
            if (!retryToken || retryToken === tokenUsed) {
                // The stored token is the one that just failed, so rotate it.
                // But if it was *just* rotated, another rotation won't fix the
                // 401 and would burn the single-use refresh token chain.
                if (GitHubOAuth.wasTokenJustRefreshed()) {
                    await clearOAuthAuthAndThrow();
                }
                try {
                    await GitHubOAuth.refreshTokenViaBackground(true);
                } catch (refreshError) {
                    // Refresh isn't possible (e.g. PAT user) or failed - surface the original 401
                    await clearOAuthAuthAndThrow();
                }
                retryToken = Preferences.getGitHubToken();
                if (!retryToken || retryToken === tokenUsed) {
                    await clearOAuthAuthAndThrow();
                }
            }

            // Retry once with the new token. `request` here is the bare inner
            // request, so no other hook can overwrite this header.
            endpoint.headers.authorization = `token ${retryToken}`;
            try {
                return await request(endpoint);
            } catch (retryError) {
                if (retryError.status === 401) {
                    await clearOAuthAuthAndThrow();
                }
                throw retryError;
            }
        }
    };

    return auth;
}

/**
 * @returns {Octokit}
 */
function getOctokit() {
    const octokit = new Octokit({
        authStrategy: createDynamicAuth,
        userAgent: 'expensify-k2-extension',
    });

    // Hook into all responses to track rate limit headers
    octokit.hook.after('request', response => {
        if (!response || !response.headers) {
            return;
        }
        RateLimitMonitor.updateFromHeaders(response.headers);
    });
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
    const regex =
        /github.com\/(?<owner>[\w-]+)\/(?<repo>[\w.-]+)(?:\/(?:issues|pull)\/(?<issue_number>\d+))?/;
    const matches = url.match(regex);

    return {
        owner: (matches && matches.groups && matches.groups.owner) || '',
        repo: (matches && matches.groups && matches.groups.repo) || '',
        issue_number: (matches && matches.groups && matches.groups.issue_number) || '',
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
        .then(data => {
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
            CacheManager.set(cacheKey, indexedResults, null, CacheManager.TTL.LONG);

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
    return new Promise(resolve => {
        let results = [];

        // This does all the pagination on the graphQL query
        function fetchPageOfIssues(cursor) {
            getOctokit()
                .graphql(query, {cursor})
                .then(queryResults => {
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

/**
 * @param {String} query The search query the issues came from; the commenter qualifier is exact where each issue's truncated comments window is not
 * @param {Object} issues Issues indexed by ID
 * @returns {Promise<Object>}
 */
function markIssuesCommentedOnByCurrentUser(query, issues) {
    const currentUser = getCurrentUser();
    const graphQLQuery = `
        query($cursor:String) {
            search(
                query: "${query} commenter:${currentUser}"
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
                        id
                    }
                }
            }
        }
    `;

    return getFullResultsUsingPagination(graphQLQuery).then(commentedIssues => {
        const commentedIssueIDs = _.pluck(commentedIssues, 'id');
        return _.mapObject(issues, issue => ({
            ...issue,
            currentUserHasCommented:
                _.contains(commentedIssueIDs, issue.id) ||
                (issue.author && issue.author.login === currentUser),
        }));
    });
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
                        author {
                            login
                        }
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
        .then(formatIssueResults)
        .then(issues => markIssuesCommentedOnByCurrentUser(query, issues));
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
                body
                isDraft
                mergeable
                number
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
                closingIssuesReferences(first: 100) {
                    nodes {
                        title
                        url
                    }
                }
                repository {
                    name
                }
                reviews {
                    totalCount
                }
                reviewRequests(first: 10) {
                    nodes {
                        requestedReviewer {
                            ... on User {
                                login
                            }
                        }
                    }
                }
                commits(last: 1) {
                    nodes {
                        commit {
                            statusCheckRollup {
                                contexts(first: 100) {
                                    nodes {
                                        ... on CheckRun {
                                            name
                                            status
                                            conclusion
                                        }
                                        ... on StatusContext {
                                            context
                                            state
                                        }
                                    }
                                }
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
        .then(data => {
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
            CacheManager.set(cacheKey, indexedResults, null, CacheManager.TTL.MEDIUM);

            return indexedResults;
        });
}

/**
 * Get the SHA of the commit at the head of a pull request, which is the commit whose checks GitHub's
 * favicon and merge box report on.
 *
 * @param {String} owner
 * @param {String} repo
 * @param {Number} pullRequestNumber
 * @returns {Promise<String|null>}
 */
function getPullRequestHeadRefOid(owner, repo, pullRequestNumber) {
    const graphQLQuery = `
query($owner:String!, $repo:String!, $number:Int!) {
    repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
            headRefOid
        }
    }
}
    `;

    return getOctokit()
        .graphql(graphQLQuery, {owner, repo, number: pullRequestNumber})
        .then(
            data =>
                (data.repository &&
                    data.repository.pullRequest &&
                    data.repository.pullRequest.headRefOid) ||
                null,
        );
}

/**
 * Get every check run and commit status that feeds the status indicator GitHub shows for a single commit.
 * These are two separate concepts in the GitHub API, and the "status check rollup" is what combines them.
 *
 * @param {String} owner
 * @param {String} repo
 * @param {String} oid The full 40 character commit SHA
 * @returns {Promise<Array<Object>>}
 */
async function getStatusCheckRollup(owner, repo, oid) {
    const graphQLQuery = `
query($owner:String!, $repo:String!, $oid:GitObjectID!, $cursor:String) {
    repository(owner: $owner, name: $repo) {
        object(oid: $oid) {
            ... on Commit {
                statusCheckRollup {
                    contexts(first: 100, after: $cursor) {
                        pageInfo {
                            endCursor
                            hasNextPage
                        }
                        nodes {
                            type: __typename
                            ... on CheckRun {
                                name
                                status
                                conclusion
                                checkSuite {
                                    workflowRun {
                                        workflow {
                                            resourcePath
                                        }
                                    }
                                }
                            }
                            ... on StatusContext {
                                context
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

    let contexts = [];
    let cursor = null;

    do {
        // eslint-disable-next-line no-await-in-loop
        const data = await getOctokit().graphql(graphQLQuery, {
            owner,
            repo,
            oid,
            cursor,
        });

        const rollup =
            data.repository && data.repository.object && data.repository.object.statusCheckRollup;
        if (!rollup) {
            // A commit that has no checks at all has a null rollup. Once pages have already been read,
            // a missing one instead means an incomplete set, and callers must not mistake the checks we
            // did manage to read for all of them.
            if (contexts.length) {
                throw new Error(`Incomplete status check rollup for ${oid}`);
            }
            return [];
        }

        contexts = contexts.concat(rollup.contexts.nodes);
        cursor = rollup.contexts.pageInfo.hasNextPage ? rollup.contexts.pageInfo.endCursor : null;
    } while (cursor);

    return contexts;
}

/**
 * Get every pull request that mentions the current issue.
 * GitHub leaves out pull requests from repositories that the user can't see.
 *
 * @returns {Promise<Array<Object>>} Pull requests in the order they appear on the issue timeline
 */
async function getCurrentIssuePullRequests() {
    const {owner, repo, issue_number: issueNumber} = getRequestParams();
    const graphQLQuery = `
query($owner:String!, $repo:String!, $number:Int!, $cursor:String) {
    repository(owner: $owner, name: $repo) {
        issue(number: $number) {
            timelineItems(first: 100, after: $cursor, itemTypes: [CROSS_REFERENCED_EVENT]) {
                pageInfo {
                    endCursor
                    hasNextPage
                }
                nodes {
                    ... on CrossReferencedEvent {
                        source {
                            ... on PullRequest {
                                number
                                title
                                url
                                state
                                isDraft
                                author {
                                    login
                                    avatarUrl(size: 40)
                                }
                                repository {
                                    name
                                    nameWithOwner
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
    `;

    let pullRequests = [];
    let cursor = null;
    do {
        // eslint-disable-next-line no-await-in-loop
        const data = await getOctokit().graphql(graphQLQuery, {
            owner,
            repo,
            number: Number(issueNumber),
            cursor,
        });
        const timelineItems =
            data.repository && data.repository.issue && data.repository.issue.timelineItems;
        if (!timelineItems) {
            break;
        }

        pullRequests = pullRequests.concat(_.map(timelineItems.nodes, node => node && node.source));
        cursor = timelineItems.pageInfo.hasNextPage ? timelineItems.pageInfo.endCursor : null;
    } while (cursor);

    // Issues also show up as cross references, and those have no url in this query.
    // A pull request can mention the issue more than once, so this keeps the first mention of each one.
    return _.uniq(
        _.filter(pullRequests, pullRequest => pullRequest && pullRequest.url),
        false,
        pullRequest => pullRequest.url,
    );
}

/**
 * @param {String} url A GitHub issue URL
 * @returns {Promise<Object>}
 */
function getIssueByURL(url) {
    const [, owner, repo, , issueNumber] = new URL(url).pathname.split('/');
    const graphQLQuery = `
query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
        issue(number: $number) {
            title
            url
        }
    }
}
    `;

    return getOctokit()
        .graphql(graphQLQuery, {owner, repo, number: Number(issueNumber)})
        .then(data => data.repository.issue);
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
    query += ' repo:Expensify/Alteryx-Data';
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
                        author {
                            login
                        }
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

    return getFullResultsUsingPagination(graphQLQuery)
        .then(formatIssueResults)
        .then(issues => markIssuesCommentedOnByCurrentUser(query, issues));
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
 * @param {String} login
 * @returns {Boolean}
 */
function isBotAuthor(login) {
    return login.endsWith('-bot') || login.endsWith('[bot]') || login === 'OSBotify';
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
                        author {
                            login
                        }
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
                                reactionGroups {
                                    viewerHasReacted
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
        .then(issues => markIssuesCommentedOnByCurrentUser(query, issues))
        .then(issues => {
            const issuesToFilter = _.filter(issues, issue => {
                const comments = issue.comments.nodes;

                // Find the last comment that mentions the current user
                const lastMentionIndex = _.reduce(
                    comments,
                    (foundIndex, comment, index) => {
                        if (
                            comment.body &&
                            comment.body.includes(`@${currentUser}`) &&
                            comment.author.login !== currentUser &&
                            !isBotAuthor(comment.author.login)
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

                const hasReactedToLastMention = _.some(
                    comments[lastMentionIndex].reactionGroups,
                    reactionGroup => reactionGroup.viewerHasReacted,
                );
                if (hasReactedToLastMention) {
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
 * @param {String} owner
 * @param {String} repo
 * @param {Number|String} number
 * @param {String} [fields] extra GraphQL fields to select on the issue or pull request
 * @returns {Promise<Object>}
 */
function getIssueOrPullRequest(owner, repo, number, fields = 'id') {
    const graphQLQuery = `
query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
        issueOrPullRequest(number: $number) {
            type: __typename
            ... on Node {
                id
            }
            ... on Issue {
                ${fields}
            }
            ... on PullRequest {
                ${fields}
            }
        }
    }
}
    `;

    return getOctokit()
        .graphql(graphQLQuery, {owner, repo, number: Number(number)})
        .then(data => data.repository.issueOrPullRequest);
}

/**
 * @param {String} mutationName addLabelsToLabelable or removeLabelsFromLabelable
 * @param {String} label
 * @returns {Promise}
 */
function changeLabel(mutationName, label) {
    const {owner, repo, issue_number} = getRequestParams();
    const graphQLQuery = `
query($owner: String!, $repo: String!, $number: Int!, $label: String!) {
    repository(owner: $owner, name: $repo) {
        issueOrPullRequest(number: $number) {
            ... on Node {
                id
            }
        }
        label(name: $label) {
            id
        }
    }
}
    `;
    const mutation = `
mutation($labelableId: ID!, $labelIds: [ID!]!) {
    ${mutationName}(input: {labelableId: $labelableId, labelIds: $labelIds}) {
        clientMutationId
    }
}
    `;

    return getOctokit()
        .graphql(graphQLQuery, {owner, repo, number: Number(issue_number), label})
        .then(data => {
            if (!data.repository.label) {
                throw new Error(`Label ${label} does not exist in ${owner}/${repo}`);
            }

            return getOctokit().graphql(mutation, {
                labelableId: data.repository.issueOrPullRequest.id,
                labelIds: [data.repository.label.id],
            });
        });
}

/**
 * Add labels to a github issue
 * @param {String} label
 * @returns {Promise}
 */
function addLabel(label) {
    return changeLabel('addLabelsToLabelable', label);
}

/**
 * Remove a label from a github issue
 * @param {String} label
 * @returns {Promise}
 */
function removeLabel(label) {
    return changeLabel('removeLabelsFromLabelable', label);
}

/**
 * @returns {Promise}
 */
function getDailyImprovements() {
    return getIssues('none', ['improvement', 'daily']);
}

/**
 * @param {String} owner
 * @param {String} repo
 * @param {Number|String} number
 * @param {String} body
 * @returns {Promise}
 */
function addCommentToIssueOrPullRequest(owner, repo, number, body) {
    const mutation = `
mutation($subjectId: ID!, $body: String!) {
    addComment(input: {subjectId: $subjectId, body: $body}) {
        clientMutationId
    }
}
    `;

    return getIssueOrPullRequest(owner, repo, number).then(subject =>
        getOctokit().graphql(mutation, {subjectId: subject.id, body}),
    );
}

/**
 * @param {String} comment
 * @returns {Promise}
 */
function addComment(comment) {
    const {owner, repo, issue_number} = getRequestParams();
    return addCommentToIssueOrPullRequest(owner, repo, issue_number, comment);
}

/**
 * Add a comment to a PR or issue identified by its URL rather than the current page
 *
 * @param {String} url
 * @param {String} body
 * @returns {Promise}
 */
function addCommentToUrl(url, body) {
    const matches = url.match(
        /github\.com\/(?<owner>[\w.-]+)\/(?<repo>[\w.-]+)\/(?:pull|issues)\/(?<number>\d+)/,
    );
    if (!matches) {
        return Promise.reject(new Error(`Could not parse a repo and number out of ${url}`));
    }
    return addCommentToIssueOrPullRequest(
        matches.groups.owner,
        matches.groups.repo,
        matches.groups.number,
        body,
    );
}

/**
 * @returns {Promise<Object>} the current issue or pull request's title, body and labels
 */
function getCurrentIssueDescription() {
    const {owner, repo, issue_number} = getRequestParams();
    return getIssueOrPullRequest(
        owner,
        repo,
        issue_number,
        'title body labels(first: 100) { nodes { name } }',
    ).then(issue => ({title: issue.title, body: issue.body, labels: issue.labels.nodes}));
}

/**
 * @param {String} body
 * @returns {Promise}
 */
function setCurrentIssueBody(body) {
    const {owner, repo, issue_number} = getRequestParams();
    const updateIssue = `
mutation($id: ID!, $body: String!) {
    updateIssue(input: {id: $id, body: $body}) {
        clientMutationId
    }
}
    `;
    const updatePullRequest = `
mutation($id: ID!, $body: String!) {
    updatePullRequest(input: {pullRequestId: $id, body: $body}) {
        clientMutationId
    }
}
    `;

    return getIssueOrPullRequest(owner, repo, issue_number).then(subject =>
        getOctokit().graphql(subject.type === 'PullRequest' ? updatePullRequest : updateIssue, {
            id: subject.id,
            body,
        }),
    );
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
 * GraphQL has no lookup by numeric ID, but node() still resolves GitHub's legacy global ID format, which is built from the type name and numeric ID.
 *
 * @param {String} typeName GraphQL type, e.g. IssueComment
 * @param {Number|String} databaseID
 * @param {String} [fields] extra GraphQL fields to select on the node
 * @returns {Promise<Object>}
 */
function getNodeByDatabaseID(typeName, databaseID, fields = 'id') {
    const legacyNodeID = btoa(
        `${String(typeName.length).padStart(3, '0')}:${typeName}${databaseID}`,
    );
    const graphQLQuery = `
query($id: ID!) {
    node(id: $id) {
        id
        ... on ${typeName} {
            ${fields}
        }
    }
}
    `;

    return getOctokit()
        .graphql(graphQLQuery, {id: legacyNodeID})
        .then(data => data.node);
}

/**
 * Look up an issue comment's GraphQL node ID by its numeric ID.
 * @param {Number|String} commentID
 * @returns {Promise<String>}
 */
function getIssueCommentNodeID(commentID) {
    return getNodeByDatabaseID('IssueComment', commentID).then(node => node.id);
}

/**
 * Look up a pull-request review's GraphQL node ID by its numeric ID.
 * @param {Number|String} reviewID
 * @returns {Promise<String>}
 */
function getPullRequestReviewNodeID(reviewID) {
    return getNodeByDatabaseID('PullRequestReview', reviewID).then(node => node.id);
}

/**
 * Look up an inline PR review-thread comment's GraphQL node ID by its numeric ID.
 * @param {Number|String} commentID
 * @returns {Promise<String>}
 */
function getPullRequestReviewCommentNodeID(commentID) {
    return getNodeByDatabaseID('PullRequestReviewComment', commentID).then(node => node.id);
}

/**
 * Minimize a comment with a GitHub reported-content classifier.
 * @param {String} nodeID GraphQL node ID of the comment subject
 * @param {String} classifier ReportedContentClassifiers enum value
 * @returns {Promise}
 */
function minimizeComment(nodeID, classifier) {
    const mutation = `
        mutation MinimizeComment($id: ID!, $classifier: ReportedContentClassifiers!) {
            minimizeComment(input: {subjectId: $id, classifier: $classifier}) {
                minimizedComment {
                    isMinimized
                    minimizedReason
                }
            }
        }
    `;
    return getOctokit().graphql(mutation, {id: nodeID, classifier});
}

/**
 * Get the reason GitHub stored for a minimized issue comment.
 * @param {Number|String} commentID
 * @returns {Promise<String>}
 */
function getIssueCommentMinimizedReason(commentID) {
    return getNodeByDatabaseID('IssueComment', commentID, 'minimizedReason').then(
        node => node.minimizedReason,
    );
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
        await getOctokit().graphql(
            'query { repository(owner: "Expensify", name: "Expensify") { id } }',
        );

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
    addCommentToUrl,
    getEngineeringIssues,
    getIssuesAssigned,
    getDailyImprovements,
    getHotPickIssues,
    addLabel,
    removeLabel,
    getMilestones,
    getCurrentUser,
    getPullsByType,
    getIssueByURL,
    getCurrentIssueDescription,
    getCurrentIssuePullRequests,
    setCurrentIssueBody,
    getPreviousInstancesOfIssue,
    triggerWorkflow,
    getWorkflowRuns,
    getWorkflowRun,
    checkK2RepoAccess,
    getIssuesMentioning,
    getIssueCommentNodeID,
    getPullRequestReviewNodeID,
    getPullRequestReviewCommentNodeID,
    minimizeComment,
    getIssueCommentMinimizedReason,
    getStatusCheckRollup,
    getPullRequestHeadRefOid,
};
