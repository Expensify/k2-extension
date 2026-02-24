import * as messenger from './lib/messenger';
import ksBrowser from './lib/browser';

messenger.startNavEventPublisher();

ksBrowser.action.setBadgeText({text: 'β'});
ksBrowser.action.setBadgeBackgroundColor({color: '#e8912d'});

const K2_BASE = 'https://github.com/Expensify/Expensify';

ksBrowser.action.onClicked.addListener((tab) => {
    ksBrowser.scripting.executeScript({
        target: {tabId: tab.id},
        func: () => {
            const meta = document.querySelector('meta[name=user-login]');
            return meta ? meta.getAttribute('content') : null;
        },
    }).then((results) => {
        const username = results && results[0] && results[0].result;
        const url = username
            ? `${K2_BASE}?currentUser=${username}#k2`
            : `${K2_BASE}#k2`;
        ksBrowser.tabs.create({url});
    });
});
