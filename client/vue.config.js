const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  publicPath: '/',
  outputDir: path.resolve(__dirname, '../server/dist'),  // Týmto zabezpečíte, že frontend sa bude buildovať do správneho adresára
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
