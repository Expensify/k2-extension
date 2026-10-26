const defaultPresets = ['@babel/preset-react', '@babel/preset-env'];
const defaultPlugins = [
  '@babel/plugin-transform-runtime',
  '@babel/plugin-proposal-class-properties',
];

module.exports = {
  env: {
    production: {
      sourceType: "unambiguous",
      presets: defaultPresets,
      plugins: [...defaultPlugins, 'transform-remove-console'],
    },
    development: {
      sourceType: "unambiguous",
      presets: defaultPresets,
      plugins: defaultPlugins,
    },
  },
};
