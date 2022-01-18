module.exports = {
    extends: 'expensify',
    parser: 'babel-eslint',
    rules: {
        'react/jsx-filename-extension': [1, {extensions: ['.js']}],
        'comma-dangle': ['error', 'always-multiline'],
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
