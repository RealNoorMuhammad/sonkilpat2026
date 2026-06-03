const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api/gecko",
    createProxyMiddleware({
      target: "https://api.geckoterminal.com",
      changeOrigin: true,
      pathRewrite: { "^/api/gecko": "/api/v2" },
    })
  );
};
