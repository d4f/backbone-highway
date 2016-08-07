/* eslint-disable */

var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var BrowserSyncPlugin = require('browser-sync-webpack-plugin');
var historyApiFallback = require('connect-history-api-fallback');

module.exports = {
  entry: ['./demo/index.js'],
  output: {
    path: process.cwd() + '/.tmp',
    filename: 'main.js'
  },
  module: {
    loaders: [
      // Transpile ES2015 to ES5
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel' },

      // Load font files
      { test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/, loader: 'file' },
      { test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url" },
    ]
  },
  plugins: [
    new BrowserSyncPlugin({
      host: 'localhost',
      port: 3000,
      logLevel: 'info',
      logConnections: true,
      server: { baseDir: ['.tmp', 'demo'] },
      bsFiles: { src: ['.tmp', 'demo'] },
      middleware: [require('connect-logger')(), historyApiFallback()]
    }),
    new webpack.HotModuleReplacementPlugin()
  ],

  watch: true,
  keepalive: true,
  inline: true,
  failOnError: false,
  progress: true
};
