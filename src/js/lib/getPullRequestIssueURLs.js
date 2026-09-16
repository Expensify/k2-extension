import _ from 'underscore';

/**
 * Include GitHub's linked issues and issue links from the PR description. When the description has a
 * Fixed Issues section, use that section so background references elsewhere do not become groups.
 *
 * @param {Object} pr
 * @returns {String[]}
 */
function getPullRequestIssueURLs(pr) {
    const body = (pr.body || '').replace(/<!--[\s\S]*?-->/g, '');
    const fixedIssues = body.match(/^#{1,6}[ \t]+(?:Fixed|Linked) Issues[ \t]*\r?\n([\s\S]*?)(?=^#{1,6}[ \t]|(?![\s\S]))/im);
    const issueURLs = (fixedIssues ? fixedIssues[1] : body).match(/https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d+\b/gi) || [];
    const linkedIssues = pr.closingIssuesReferences ? pr.closingIssuesReferences.nodes : [];

    return _.uniq(_.map([..._.pluck(linkedIssues, 'url'), ...issueURLs], url => url.toLowerCase()));
}

export default getPullRequestIssueURLs;
