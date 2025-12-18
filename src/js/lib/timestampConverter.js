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
 * @param {Boolean} useStaticTimestamps Whether to use static timestamps
 */
function convertTimestamps(useStaticTimestamps) {
    if (useStaticTimestamps) {
        // Find all relative-time elements that haven't been replaced yet
        const elements = document.querySelectorAll('relative-time:not([data-k2-replaced])');

        // eslint-disable-next-line no-console
        console.log('[K2 Timestamp Converter] Converting to static:', {
            elementCount: elements.length,
        });

        Array.from(elements).forEach((el) => {
            const datetime = el.getAttribute('datetime');

            if (!datetime) {
                return;
            }

            // Format the date
            const formattedDate = formatTimestamp(datetime);

            // Replace the relative-time element with a span showing static timestamp
            // We can't modify shadow DOM content, so we replace the entire element
            const span = document.createElement('span');
            span.textContent = formattedDate;
            span.className = el.className;
            span.setAttribute('title', formattedDate);
            span.dataset.k2StaticTimestamp = 'true';
            span.dataset.k2OriginalDatetime = datetime;

            // Mark original as replaced
            // eslint-disable-next-line no-param-reassign
            el.dataset.k2Replaced = 'true';

            const parent = el.parentNode;
            if (parent) {
                parent.replaceChild(span, el);
            }
        });

        // Also update any existing static timestamps in case the page content changed
        const existingStatic = document.querySelectorAll('[data-k2-static-timestamp="true"]');
        Array.from(existingStatic).forEach((span) => {
            const datetime = span.dataset.k2OriginalDatetime;
            if (datetime) {
                const formattedDate = formatTimestamp(datetime);
                // eslint-disable-next-line no-param-reassign
                span.textContent = formattedDate;
            }
        });
    } else {
        // Find all our replacement spans and restore relative-time elements
        const replacements = document.querySelectorAll('[data-k2-static-timestamp="true"]');

        // eslint-disable-next-line no-console
        console.log('[K2 Timestamp Converter] Restoring relative timestamps:', {
            elementCount: replacements.length,
        });

        Array.from(replacements).forEach((replacement) => {
            const datetime = replacement.dataset.k2OriginalDatetime;
            if (datetime) {
                // Create a new relative-time element
                const relativeTimeEl = document.createElement('relative-time');
                relativeTimeEl.setAttribute('datetime', datetime);
                relativeTimeEl.className = replacement.className;

                const parent = replacement.parentNode;
                if (parent) {
                    parent.replaceChild(relativeTimeEl, replacement);
                }
            }
        });
    }
}

export default convertTimestamps;
