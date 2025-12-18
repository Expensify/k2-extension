import $ from 'jquery';

/**
 * Converts all relative-time elements on the page based on the preference
 * @param {Boolean} useStaticTimestamps Whether to use static timestamps
 */
function convertTimestamps(useStaticTimestamps) {
    // eslint-disable-next-line rulesdir/prefer-underscore-method
    $('relative-time').each((i, el) => {
        const $el = $(el);
        if (useStaticTimestamps) {
            // Set format="datetime" to show static timestamps
            if (!$el.attr('format') || $el.attr('format') !== 'datetime') {
                $el.attr('format', 'datetime');
            }
        } else if ($el.attr('format')) {
            // Remove format attribute to restore relative display
            $el.removeAttr('format');
        }
    });
}

export default convertTimestamps;
