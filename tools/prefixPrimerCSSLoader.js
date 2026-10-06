const postcss = require('postcss');
const selectorParser = require('postcss-selector-parser');

const ROOT_CLASS = 'k2-primer-root';

function scopeSelector(selector) {
    return selectorParser((selectors) => {
        // eslint-disable-next-line rulesdir/prefer-underscore-method
        selectors.each((parsedSelector) => {
            const firstNode = parsedSelector.at(0);
            if (firstNode.type === 'pseudo' && firstNode.value === ':root') {
                firstNode.replaceWith(selectorParser.className({value: ROOT_CLASS}));
                return;
            }
            if (firstNode.type === 'tag' && (firstNode.value === 'body' || firstNode.value === 'html')) {
                firstNode.replaceWith(selectorParser.className({value: ROOT_CLASS}));
                return;
            }

            // BaseStyles shares the root element with the scope class.
            if (firstNode.type === 'class' && firstNode.value.startsWith('prc-src-BaseStyles')) {
                parsedSelector.prepend(selectorParser.className({value: ROOT_CLASS}));
                return;
            }

            // Theme rules begin with an attribute that is set on the root itself.
            if (firstNode.type === 'attribute' && firstNode.attribute.startsWith('data-')) {
                parsedSelector.prepend(selectorParser.className({value: ROOT_CLASS}));
                return;
            }

            parsedSelector.prepend(selectorParser.combinator({value: ' '}));
            parsedSelector.prepend(selectorParser.className({value: ROOT_CLASS}));
        });
    }).processSync(selector);
}

module.exports = function prefixPrimerCSSLoader(source) {
    const css = postcss.parse(source);
    css.walkRules((rule) => {
        if (rule.parent.type === 'atrule' && rule.parent.name.includes('keyframes')) {
            return;
        }
        rule.cloneBefore({selector: scopeSelector(rule.selector)});
        rule.remove();
    });
    return css.toString();
};
