/**
 * Formats a datetime string to "Dec 16, 2025 6:30 PM EST" format
 * @param {String} datetimeString ISO 8601 datetime string
 * @returns {String} Formatted date string
 */
function formatTimestamp(datetimeString) {
    const date = new Date(datetimeString);
    const options = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZoneName: 'short',
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Converts all relative-time elements on the page based on the preference
 * @param {Boolean} useAbsoluteTimestamps Whether to use absolute timestamps
 */
function convertTimestamps(useAbsoluteTimestamps) {
    if (useAbsoluteTimestamps) {
        // Find all relative-time elements that don't have absolute timestamp added yet
        const elements = document.querySelectorAll('relative-time:not([data-k2-absolute-added])');

        Array.from(elements).forEach((el) => {
            const datetime = el.getAttribute('datetime');

            if (!datetime) {
                return;
            }

            // Create a span for the absolute timestamp
            const absoluteSpan = document.createElement('span');
            const absoluteTime = formatTimestamp(datetime);
            absoluteSpan.textContent = ` (${absoluteTime})`;
            absoluteSpan.dataset.k2AbsolutePart = 'true';

            // Add the absolute span after the relative-time element
            const parent = el.parentNode;
            if (parent) {
                // Insert the absolute span right after the relative-time element
                if (el.nextSibling) {
                    parent.insertBefore(absoluteSpan, el.nextSibling);
                } else {
                    parent.appendChild(absoluteSpan);
                }

                // Mark that we've added the absolute part
                // eslint-disable-next-line no-param-reassign
                el.dataset.k2AbsoluteAdded = 'true';

                // Store datetime for updates
                // eslint-disable-next-line no-param-reassign
                el.dataset.k2OriginalDatetime = datetime;
            }
        });

        // Update existing absolute parts (refresh the absolute timestamp)
        const elementsWithAbsolute = document.querySelectorAll('relative-time[data-k2-absolute-added="true"]');
        Array.from(elementsWithAbsolute).forEach((el) => {
            const datetime = el.dataset.k2OriginalDatetime || el.getAttribute('datetime');
            if (datetime) {
                // Find the absolute span that follows this element
                let absoluteSpan = el.nextSibling;
                while (absoluteSpan && (!absoluteSpan.dataset || absoluteSpan.dataset.k2AbsolutePart !== 'true')) {
                    absoluteSpan = absoluteSpan.nextSibling;
                }

                if (absoluteSpan && absoluteSpan.dataset.k2AbsolutePart === 'true') {
                    const absoluteTime = formatTimestamp(datetime);
                    // eslint-disable-next-line no-param-reassign
                    absoluteSpan.textContent = ` (${absoluteTime})`;
                }
            }
        });
    } else {
        // Find all relative-time elements that have absolute timestamps added
        const elements = document.querySelectorAll('relative-time[data-k2-absolute-added="true"]');

        Array.from(elements).forEach((el) => {
            // Find and remove the absolute timestamp span
            let absoluteSpan = el.nextSibling;
            while (absoluteSpan && (!absoluteSpan.dataset || absoluteSpan.dataset.k2AbsolutePart !== 'true')) {
                absoluteSpan = absoluteSpan.nextSibling;
            }

            if (absoluteSpan && absoluteSpan.dataset.k2AbsolutePart === 'true') {
                const parent = absoluteSpan.parentNode;
                if (parent) {
                    parent.removeChild(absoluteSpan);
                }
            }

            // Remove our markers
            // eslint-disable-next-line no-param-reassign
            delete el.dataset.k2AbsoluteAdded;
            // eslint-disable-next-line no-param-reassign
            delete el.dataset.k2OriginalDatetime;
        });
    }
}

export default convertTimestamps;
