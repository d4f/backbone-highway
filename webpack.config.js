const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const cwd = process.cwd()

const config = {
  entry: ['./demo/index.js'],
  output: {
    path: path.join(cwd, '.tmp'),
    filename: 'main.js'
  },
  module: {
    rules: [
      // Transpile ES2015 to ES5
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },

      // Load font files
      { test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/, loader: 'file-loader' },
      { test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader' }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin()
  ],
  devServer: {
    // contentBase: path.join(__dirname, 'public'), // boolean | string | array, static file location
    compress: true, // enable gzip compression
    historyApiFallback: true, // true for index.html upon 404, object for multiple paths
    hot: true, // hot module replacement. Depends on HotModuleReplacementPlugin
    https: false, // true for self-signed, object for cert authority
    noInfo: true // only errors & warns on hot reload
  },
  target: 'web',
  devtool: 'inline-source-map'
}

module.exports = config
