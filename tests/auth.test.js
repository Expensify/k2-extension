const assert = require('node:assert/strict');
const {registerHooks} = require('node:module');
const {beforeEach, test} = require('node:test');

let storage = {};
const authKey = 'k2GitHubAuth';
let receiveMessage;

globalThis.chrome = {
    storage: {
        local: {
            get: async () => ({...storage}),
            set: async values => {
                storage = {...storage, ...values};
            },
        },
    },
    runtime: {
        onMessage: {
            addListener: listener => {
                receiveMessage = listener;
            },
        },
        sendMessage: (message, callback) => {
            assert.equal(receiveMessage(message, {}, callback), true);
        },
    },
};

// Resolve the extensionless imports normally handled by Webpack.
const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier.startsWith('./') && !specifier.endsWith('.js')) {
            return {...nextResolve(`${specifier}.js`, context), format: 'module'};
        }
        return nextResolve(specifier, context);
    },
});
require('../src/js/events');
const GitHubOAuth = require('../src/js/lib/GitHubOAuth');

hooks.deregister();

const expiredAuth = {
    type: 'oauth',
    token: 'old-access-token',
    refreshToken: 'old-refresh-token',
    expiresAt: 1,
};
const refreshed = {
    access_token: 'new-access-token',
    refresh_token: 'new-refresh-token',
    expires_in: 28800,
};

beforeEach(() => {
    storage = {};
});

test('migrates a legacy PAT once and never restores it after sign-out', async () => {
    const pat = {type: 'pat', token: 'legacy-pat'};
    await GitHubOAuth.migrateLegacyAuth(pat);
    assert.equal((await GitHubOAuth.getValidGitHubToken()).token, pat.token);

    await GitHubOAuth.clearGitHubAuth();
    assert.equal((await GitHubOAuth.migrateLegacyAuth(pat)).authenticated, false);
    await assert.rejects(GitHubOAuth.getValidGitHubToken(), /No GitHub auth data/);
});

test('prefers the existing background OAuth token over stale Onyx credentials', async () => {
    storage.k2OAuthAuth = {...expiredAuth, expiresAt: null};
    await GitHubOAuth.migrateLegacyAuth({type: 'pat', token: 'old-pat'});
    assert.equal(storage.k2OAuthAuth, null);
    assert.equal((await GitHubOAuth.getValidGitHubToken()).token, expiredAuth.token);
});

test('shares concurrent refreshes and ignores rejection of an older token', async t => {
    storage[authKey] = expiredAuth;
    const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json(refreshed));

    const first = GitHubOAuth.getValidGitHubToken(true, expiredAuth.token);
    const second = GitHubOAuth.getValidGitHubToken(true, expiredAuth.token);
    assert.deepEqual(await first, await second);
    assert.equal(fetch.mock.callCount(), 1);

    await GitHubOAuth.clearGitHubAuth(expiredAuth.token);
    assert.equal((await GitHubOAuth.getValidGitHubToken()).token, refreshed.access_token);
});

test('a transient refresh failure keeps credentials but a rejected refresh token clears them', async t => {
    storage[authKey] = expiredAuth;
    const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(null, {status: 503}));
    await assert.rejects(GitHubOAuth.getValidGitHubToken(), /503/);
    assert.equal(storage[authKey], expiredAuth);

    fetch.mock.mockImplementation(async () => new Response(null, {status: 401}));
    await assert.rejects(GitHubOAuth.getValidGitHubToken(), /401/);
    assert.equal((await GitHubOAuth.getAuthState()).authenticated, false);
});

test('a refresh already in progress does not restore a signed-out session', async t => {
    storage[authKey] = expiredAuth;
    const response = Promise.withResolvers();
    const refreshStarted = Promise.withResolvers();
    t.mock.method(globalThis, 'fetch', () => {
        refreshStarted.resolve();
        return response.promise;
    });

    const refresh = assert.rejects(GitHubOAuth.getValidGitHubToken(), /auth changed/);
    await refreshStarted.promise;
    await GitHubOAuth.clearGitHubAuth();
    response.resolve(Response.json(refreshed));
    await refresh;
    assert.equal((await GitHubOAuth.getAuthState()).authenticated, false);
});
