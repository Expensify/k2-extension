const path = require('path');
const rulesdir = require('eslint-plugin-rulesdir');

rulesdir.RULES_DIR = path.dirname(require.resolve('eslint-config-expensify/eslint-plugin-expensify/CONST'));

const rules = rulesdir.rules;
const noAccumulatorSpread = rules['no-acc-spread-in-reduce'];

rules['no-acc-spread-in-reduce'] = {
    ...noAccumulatorSpread,
    create(context) {
        const compatibleContext = new Proxy(context, {
            get(target, property, receiver) {
                if (property === 'getDeclaredVariables') {
                    return node => context.sourceCode.getDeclaredVariables(node);
                }

                return Reflect.get(target, property, receiver);
            },
        });

        return noAccumulatorSpread.create(compatibleContext);
    },
};

module.exports = {
    meta: {name: 'eslint-plugin-rulesdir'},
    rules,
};
