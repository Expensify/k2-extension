/**
 * This is a file containing constants shared across the extension
 */
export default {
    // Check runs whose results should not affect the overall check conclusion shown for a commit or a PR.
    // "Check independent approval" (from the "Verify peer review" workflow) fails until a peer review
    // happens, which is not a CI failure the author needs to act on.
    IGNORED_CHECK_RUN_NAMES: ['Check independent approval'],

    // A ruleset-required workflow run keeps the repository the workflow came from in its resource path,
    // e.g. /Expensify/App/actions/workflows/required/Expensify/GitHub-Actions/.github/workflows/...
    // That is the part of the run a PR author cannot reproduce from a workflow file on their own branch,
    // so it is what tells a real peer review check apart from a job that merely shares its name.
    PEER_REVIEW_WORKFLOW_PATH: 'required/Expensify/GitHub-Actions/.github/workflows/verifyPeerReview.yml',
};
