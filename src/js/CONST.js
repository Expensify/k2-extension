/**
 * This is a file containing constants shared across the extension
 */
export default {
    // Check runs whose results should not affect the overall check conclusion shown for a commit or a PR.
    // "Check independent approval" (from the "Verify peer review" workflow) fails until a peer review
    // happens, which is not a CI failure the author needs to act on.
    IGNORED_CHECK_RUN_NAMES: ['Check independent approval'],
};
