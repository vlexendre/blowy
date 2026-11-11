// babel-preset-expo inclut déjà le plugin Reanimated / worklets.
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
