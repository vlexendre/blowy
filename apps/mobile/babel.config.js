// babel-preset-expo (SDK 58) inclut le plugin Reanimated/worklets automatiquement.
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
