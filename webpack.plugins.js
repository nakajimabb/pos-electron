const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new CopyPlugin({
    patterns: [{ from: 'icons', to: 'icons' }],
  }),
  new webpack.ProvidePlugin({
    process: 'process/browser',
  }),
];
