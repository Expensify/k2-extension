import _ from 'underscore';
import ReactNativeOnyx from 'react-native-onyx';
import * as API from '../api';
import ONYXKEYS from '../../ONYXKEYS';

const DATA_PHP_PATH = '_devportal/lib/KernelScheduling/Data.php';
const ORG = 'Expensify';
const EMPLOYEE_TEAM_SLUG = 'expensify-expensify';
const CONTRACTOR_TEAM_SLUGS = [
    'external-expert-contributors',
    'baires-dev',
    'contributor-plus-backend',
    'software-mansion-backend',
    'tecla',
    'applause',
    'applause-accessibility',
];

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

let manualRequestUsers = null;
let contractorUsers = null;
let employeeUsers = null;
let lastFetched = null;
let fetchPromise = null;
let fetchFailed = false;

ReactNativeOnyx.connect({
    key: ONYXKEYS.MANUAL_REQUEST_USERS,
    callback: (cached) => {
        if (!cached || manualRequestUsers) {
            return;
        }
        manualRequestUsers = new Set(_.map(cached, u => u.toLowerCase()));
    },
});

ReactNativeOnyx.connect({
    key: ONYXKEYS.CONTRACTOR_USERS,
    callback: (cached) => {
        if (!cached || contractorUsers) {
            return;
        }
        contractorUsers = new Set(_.map(cached, u => u.toLowerCase()));
    },
});

ReactNativeOnyx.connect({
    key: ONYXKEYS.EMPLOYEE_USERS,
    callback: (cached) => {
        if (!cached || employeeUsers) {
            return;
        }
        employeeUsers = new Set(_.map(cached, u => u.toLowerCase()));
    },
});

ReactNativeOnyx.connect({
    key: ONYXKEYS.PAYMENT_INFO_LAST_FETCHED,
    callback: (cached) => {
        if (!cached) {
            return;
        }
        lastFetched = cached;
    },
});

/**
 * Extract a PHP string-literal array constant from source.
 * Only captures values wrapped in single quotes.
 *
 * @param {String} phpSource
 * @param {String} constName
 * @returns {String[]}
 */
function parseArrayConstant(phpSource, constName) {
    const regex = new RegExp(`${constName}\\s*=\\s*\\[([\\s\\S]*?)\\];`);
    const match = phpSource.match(regex);
    if (!match) {
        return [];
    }
    const entries = [];
    const pattern = /'([^']+)'/g;
    let entry;
    // eslint-disable-next-line no-cond-assign
    while ((entry = pattern.exec(match[1])) !== null) {
        entries.push(entry[1].toLowerCase());
    }
    return entries;
}

/**
 * Fetches Data.php from Web-Expensify and team membership from the GitHub API,
 * then categorises every contributor into one of:
 *   manual-request | contractor | employee | upwork
 *
 * Results are persisted in Onyx so subsequent navigations skip the network.
 *
 * @returns {Promise<void>}
 */
function fetchManualRequestUsers() {
    const cacheIsStale = !lastFetched || (Date.now() - lastFetched) > CACHE_TTL_MS;
    if (manualRequestUsers && contractorUsers && employeeUsers && !cacheIsStale) {
        return Promise.resolve();
    }

    if (fetchFailed) {
        return Promise.resolve();
    }

    if (fetchPromise) {
        return fetchPromise;
    }

    if (!API.isAuthenticated()) {
        return Promise.resolve();
    }

    // When the cache is stale, clear in-memory sets so fresh data is written
    if (cacheIsStale) {
        manualRequestUsers = null;
        contractorUsers = null;
        employeeUsers = null;
    }

    fetchPromise = API.getFileContents(ORG, 'Web-Expensify', DATA_PHP_PATH)
        .then((phpSource) => {
            const manualArray = parseArrayConstant(phpSource, 'MANUAL_REQUEST_GH_USERNAMES');
            const contractorArray = parseArrayConstant(phpSource, 'CONTRACTOR_GH_USERNAMES');
            const botOpenAI = parseArrayConstant(phpSource, 'BOT_OPENAI_GH_USERNAMES');

            manualRequestUsers = new Set(manualArray);
            ReactNativeOnyx.set(ONYXKEYS.MANUAL_REQUEST_USERS, manualArray);

            const staticContractors = contractorArray.concat(botOpenAI);

            const contractorPromises = _.map(CONTRACTOR_TEAM_SLUGS, slug => API.getTeamMembers(ORG, slug).catch(() => []));
            const employeePromise = API.getTeamMembers(ORG, EMPLOYEE_TEAM_SLUG).catch(() => []);

            return Promise.all([
                Promise.all(contractorPromises),
                employeePromise,
            ]).then(([contractorTeams, employees]) => {
                const allContractors = staticContractors.slice();
                _.each(contractorTeams, (members) => {
                    _.each(members, m => allContractors.push(m.toLowerCase()));
                });
                contractorUsers = new Set(allContractors);
                ReactNativeOnyx.set(ONYXKEYS.CONTRACTOR_USERS, [...contractorUsers]);

                const empArray = _.map(employees, e => e.toLowerCase());
                employeeUsers = new Set(empArray);
                ReactNativeOnyx.set(ONYXKEYS.EMPLOYEE_USERS, empArray);

                lastFetched = Date.now();
                ReactNativeOnyx.set(ONYXKEYS.PAYMENT_INFO_LAST_FETCHED, lastFetched);
            });
        })
        .catch((err) => {
            fetchFailed = true;
            // eslint-disable-next-line no-console
            console.warn('[K2] Could not fetch contributor payment info.', err);
            manualRequestUsers = manualRequestUsers || new Set();
            contractorUsers = contractorUsers || new Set();
            employeeUsers = employeeUsers || new Set();
        })
        .finally(() => {
            fetchPromise = null;
        });

    return fetchPromise;
}

/**
 * @param {String} username
 * @returns {Boolean}
 */
function isBot(username) {
    const lower = username.toLowerCase();
    return lower.endsWith('[bot]')
        || lower.endsWith('-bot')
        || lower.endsWith('_bot')
        || lower === 'osbotify'
        || lower === 'osbotify-admin'
        || lower === 'melvinbot';
}

/**
 * Determine the payment category for a GitHub username.
 *
 * @param {String} username
 * @returns {'employee'|'manual-request'|'contractor'|'upwork'|'bot'|null}
 *          null when data has not loaded yet
 */
function getPaymentCategory(username) {
    if (!manualRequestUsers || !contractorUsers || !employeeUsers) {
        return null;
    }
    if (isBot(username)) {
        return 'bot';
    }
    const lower = username.toLowerCase();
    if (employeeUsers.has(lower)) {
        return 'employee';
    }
    if (manualRequestUsers.has(lower)) {
        return 'manual-request';
    }
    if (contractorUsers.has(lower)) {
        return 'contractor';
    }
    return 'upwork';
}

/**
 * @param {String} username
 * @returns {Boolean}
 */
function isManualRequestUser(username) {
    if (!manualRequestUsers) {
        return false;
    }
    return manualRequestUsers.has(username.toLowerCase());
}

/**
 * @returns {Boolean} whether all payment data has been loaded
 */
function isLoaded() {
    return manualRequestUsers !== null
        && contractorUsers !== null
        && employeeUsers !== null;
}

/**
 * Invalidate cached payment data and re-fetch from the network.
 *
 * @returns {Promise<void>}
 */
function forceRefresh() {
    manualRequestUsers = null;
    contractorUsers = null;
    employeeUsers = null;
    lastFetched = null;
    fetchFailed = false;
    fetchPromise = null;
    ReactNativeOnyx.set(ONYXKEYS.PAYMENT_INFO_LAST_FETCHED, null);
    return fetchManualRequestUsers();
}

export {
    fetchManualRequestUsers,
    forceRefresh,
    getPaymentCategory,
    isManualRequestUser,
    isLoaded,
};
