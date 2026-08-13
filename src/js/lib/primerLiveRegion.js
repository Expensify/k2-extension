const REGION_ID = 'k2-primer-live-region';

function getRegion(appendTo = document.body) {
    let region = document.getElementById(REGION_ID);
    if (region) {
        return region;
    }

    region = document.createElement('div');
    region.id = REGION_ID;
    region.setAttribute('aria-atomic', 'true');
    region.style.border = '0';
    region.style.clipPath = 'inset(50%)';
    region.style.height = '1px';
    region.style.overflow = 'hidden';
    region.style.position = 'absolute';
    region.style.whiteSpace = 'nowrap';
    region.style.width = '1px';
    appendTo.appendChild(region);
    return region;
}

function announce(message, options = {}) {
    const region = getRegion(options.appendTo);
    const delay = options.delayMs || 0;
    let timeout;
    let resolveAnnouncement;
    const result = new Promise((resolve) => {
        resolveAnnouncement = resolve;
        timeout = setTimeout(() => {
            region.setAttribute('aria-live', options.politeness || 'polite');
            region.textContent = '';
            window.requestAnimationFrame(() => {
                region.textContent = message;
                resolve();
            });
        }, delay);
    });
    result.cancel = () => {
        clearTimeout(timeout);
        resolveAnnouncement();
    };
    return result;
}

function announceFromElement(element, options) {
    return announce(element.textContent || '', options);
}

class LiveRegionElement extends HTMLElement {
    announce(message, options) {
        return announce(message, {...options, appendTo: this});
    }

    announceFromElement(element, options) {
        return announceFromElement(element, {...options, appendTo: this});
    }

    clear() {
        this.textContent = '';
    }
}

const templateContent = '';

export {
    announce, announceFromElement, LiveRegionElement, templateContent,
};
