const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  publicPath: '/client',
  outputDir: 'dist',
  transpileDependencies: true,
  devServer: {
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'https://mirkapoker-server.onrender.com',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    },
  },
});

