module.exports = {
    extends: 'expensify',
    parser: '@babel/eslint-parser',
    rules: {
        'react/jsx-filename-extension': [1, {extensions: ['.js']}],
        'comma-dangle': ['error', 'always-multiline'],
        'rulesdir/no-api-in-views': 'off',
        'rulesdir/no-multiple-api-calls': 'off',
        '@lwc/lwc/no-async-await': 'off',
        'es/no-nullish-coalescing-operators' : 'off'
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: [
                    '.js',
                ],
            },
        },
    },
};
