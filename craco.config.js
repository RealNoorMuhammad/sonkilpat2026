/** Suppress noisy third-party source-map and postcss warnings in CRA/webpack 5. */
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.module.rules.forEach((rule) => {
        if (!rule.oneOf) return;
        rule.oneOf.forEach((oneOfRule) => {
          if (
            oneOfRule.loader &&
            oneOfRule.loader.includes("source-map-loader")
          ) {
            oneOfRule.exclude = /node_modules/;
          }
        });
      });

      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map/,
        /autoprefixer/,
        /color-adjust/,
      ];

      return webpackConfig;
    },
  },
};
