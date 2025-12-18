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
        // Find all relative-time elements that don't have static timestamp added yet
        const elements = document.querySelectorAll('relative-time:not([data-k2-static-added])');

        // eslint-disable-next-line no-console
        console.log('[K2 Timestamp Converter] Showing timestamps:', {
            elementCount: elements.length,
        });

        Array.from(elements).forEach((el) => {
            const datetime = el.getAttribute('datetime');

            if (!datetime) {
                return;
            }

            // Create a span for the static timestamp
            const staticSpan = document.createElement('span');
            const staticTime = formatTimestamp(datetime);
            staticSpan.textContent = ` (${staticTime})`;
            staticSpan.dataset.k2StaticPart = 'true';

            // Add the static span after the relative-time element
            const parent = el.parentNode;
            if (parent) {
                // Insert the static span right after the relative-time element
                if (el.nextSibling) {
                    parent.insertBefore(staticSpan, el.nextSibling);
                } else {
                    parent.appendChild(staticSpan);
                }

                // Mark that we've added the static part
                // eslint-disable-next-line no-param-reassign
                el.dataset.k2StaticAdded = 'true';

                // Store datetime for updates
                // eslint-disable-next-line no-param-reassign
                el.dataset.k2OriginalDatetime = datetime;
            }
        });

        // Update existing static parts (refresh the static timestamp)
        const elementsWithStatic = document.querySelectorAll('relative-time[data-k2-static-added="true"]');
        Array.from(elementsWithStatic).forEach((el) => {
            const datetime = el.dataset.k2OriginalDatetime || el.getAttribute('datetime');
            if (datetime) {
                // Find the static span that follows this element
                let staticSpan = el.nextSibling;
                while (staticSpan && (!staticSpan.dataset || staticSpan.dataset.k2StaticPart !== 'true')) {
                    staticSpan = staticSpan.nextSibling;
                }

                if (staticSpan && staticSpan.dataset.k2StaticPart === 'true') {
                    const staticTime = formatTimestamp(datetime);
                    // eslint-disable-next-line no-param-reassign
                    staticSpan.textContent = ` (${staticTime})`;
                }
            }
        });
    } else {
        // Find all relative-time elements that have static timestamps added
        const elements = document.querySelectorAll('relative-time[data-k2-static-added="true"]');

        // eslint-disable-next-line no-console
        console.log('[K2 Timestamp Converter] Hiding timestamps:', {
            elementCount: elements.length,
        });

        Array.from(elements).forEach((el) => {
            // Find and remove the static timestamp span
            let staticSpan = el.nextSibling;
            while (staticSpan && (!staticSpan.dataset || staticSpan.dataset.k2StaticPart !== 'true')) {
                staticSpan = staticSpan.nextSibling;
            }

            if (staticSpan && staticSpan.dataset.k2StaticPart === 'true') {
                const parent = staticSpan.parentNode;
                if (parent) {
                    parent.removeChild(staticSpan);
                }
            }

            // Remove our markers
            // eslint-disable-next-line no-param-reassign
            delete el.dataset.k2StaticAdded;
            // eslint-disable-next-line no-param-reassign
            delete el.dataset.k2OriginalDatetime;
        });
    }
}

export default convertTimestamps;
