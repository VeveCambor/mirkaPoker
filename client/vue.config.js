const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  publicPath: '/',
  outputDir: 'dist',
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: 'https://mirkapoker-server.onrender.com',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
      '/socket.io': {
        target: 'https://mirkapoker-server.onrender.com',
        changeOrigin: true,
        ws: true,
      },
    },
    historyApiFallback: true,
  },
});