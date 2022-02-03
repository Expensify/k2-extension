import ksBrowser from './browser';

const listeners = {};

/**
 * Listens to all of our nav events and sends a 'nav' message
 * to each tab when one of the events is triggered
 */
function startNavEventPublisher() {
    const navEventList = [
        'onHistoryStateUpdated',
    ];

    navEventList.forEach((e) => {
        ksBrowser.webNavigation[e].addListener(() => {
            ksBrowser.tabs.query({
                active: true,
                currentWindow: true,
            }, (tabs) => {
                ksBrowser.tabs.sendMessage(tabs[0].id, 'nav');
            });
        });
    });
}

/**
 * listen to specific message events and triggers the callbacks
 *
 * @param {string} eventName
 * @param {Function} cb
 */
function on(eventName, cb) {
    if (!listeners[eventName]) {
        listeners[eventName] = [];
    }

    listeners[eventName].push(cb);
}

/**
 * Trigger the callbacks for an event name and pass them optional data
 *
 * @param {string} eventName
 * @param {Object|undefined} data (optional)
 */
function trigger(eventName, data) {
    if (listeners[eventName] && listeners[eventName].length) {
        for (let i = 0; i < listeners[eventName].length; i++) {
            const callback = listeners[eventName][i];
            callback.apply(null, data);
        }
    }
}

/**
 * Listens to runtime messages and triggers the proper
 * event listeners
 */
function startMessageListener() {
    ksBrowser.runtime.onMessage.addListener((request) => {
        trigger(request);
    });
}

/**
 * PUBLIC API
 */
export {
    startNavEventPublisher,
    startMessageListener,
    on,
};
