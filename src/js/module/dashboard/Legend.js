import React from 'react';
import ReactNativeOnyx from 'react-native-onyx';
import * as Preferences from '../../lib/actions/Preferences';

const Legend = () => {
    function signOut() {
        Preferences.setGitHubToken('');
        // ReactNativeOnyx.clear();
        window.location.reload();
    }

    return (
        <div className="legend">
            <button
                type="button"
                onClick={signOut}
                className="btn tooltipped tooltipped-sw"
                aria-label="Sign Out"
            >
                Sign Out
            </button>
            <br />
            <br />
            <a
                className="btn btn-primary"
                aria-label="New Issue"
                href="https://github.com/Expensify/Expensify/issues/new/choose"
                target="_blank"
                rel="noopener noreferrer"
            >
                New Issue
            </a>

            <br />
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
    );
};

Legend.displayName = 'Legend';

export default Legend;
