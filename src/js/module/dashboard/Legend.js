import React from 'react';
import ReactNativeOnyx from 'react-native-onyx';
import * as Preferences from '../../lib/actions/Preferences';
import * as GitHubOAuth from '../../lib/GitHubOAuth';

function Legend() {
    const [showLegendItems, setShowLegendItems] = React.useState(false);

    async function signOut() {
        try {
            // Revoke OAuth token if using OAuth
            if (Preferences.getAuthType() === 'oauth') {
                await GitHubOAuth.revokeToken();
            }
        } catch (error) {
            // Silently handle error - token revocation is best effort
        }

        // Clear all authentication data
        Preferences.clearAuth();
        ReactNativeOnyx.clear();
        window.location.reload();
    }

    return (
        <div className="legend">
            <a
                className="btn btn-primary btn-block"
                aria-label="New Issue"
                href="https://github.com/Expensify/Expensify/issues/new/choose"
                target="_blank"
                rel="noopener noreferrer"
            >
                New Issue
            </a>

            <button
                type="button"
                onClick={() => setShowLegendItems(!showLegendItems)}
                className="btn-link legend-link"
                aria-expanded={showLegendItems}
            >
                {showLegendItems ? 'Hide legend' : 'Show legend'}
            </button>

            {showLegendItems && (
                <div className="legend-items">
                    <a
                        className="btn btn-block"
                        aria-label="New /app Issue"
                        href="https://github.com/Expensify/App/issues/new/choose"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        New /app Issue
                    </a>
                    <div className="issue reviewing">Under Review</div>
                    <div className="issue overdue">Overdue</div>
                    <div className="issue planning">Planning</div>
                    <div className="issue contributor-assigned">Contributor Assigned</div>
                    <div className="issue">
                        <sup>E</sup>
                        {' '}
                        External
                    </div>
                    <div>
                        <span className="owner">★</span>
                        {' '}
                        Issue owner
                    </div>
                    <div>
                        <span>☆</span>
                        {' '}
                        Issue is owned by someone else
                    </div>
                    <div className="issue">
                        <sup>I</sup>
                        {' '}
                        Improvement
                    </div>
                    <div className="issue">
                        <sup>T</sup>
                        {' '}
                        Task
                    </div>
                    <div className="issue">
                        <sup>F</sup>
                        {' '}
                        New Feature
                    </div>
                    <div>
                        <span className="label hourly">H</span>
                        {' '}
                        Hourly
                    </div>
                    <div>
                        <span className="label daily">D</span>
                        {' '}
                        Daily
                    </div>
                    <div>
                        <span className="label weekly">W</span>
                        {' '}
                        Weekly
                    </div>
                    <div>
                        <span className="label monthly">M</span>
                        {' '}
                        Monthly
                    </div>
                    <div>
                        <span className="label newhire">FP</span>
                        {' '}
                        First Pick
                    </div>
                    <div>
                        <span className="label whatsnext">WN</span>
                        {' '}
                        WhatsNext
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={signOut}
                className="btn-link legend-link legend-sign-out"
            >
                Sign Out
            </button>
        </div>
    );
}

Legend.displayName = 'Legend';

export default Legend;
