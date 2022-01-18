const defaultPresets = ['@babel/preset-react', '@babel/preset-env'];
const defaultPlugins = [
  '@babel/plugin-transform-runtime',
  '@babel/plugin-proposal-class-properties',

  // We use `transform-class-properties` for transforming ReactNative libraries and do not use it for our own
  // source code transformation as we do not use class property assignment.
  'transform-class-properties',
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
