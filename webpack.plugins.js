const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new CopyPlugin({
    patterns: [
      { from: 'icons', to: 'icons' },
      { from: 'epos-2.22.0.js', to: 'epos-2.22.0.js' },
    ],
  }),
  new webpack.ProvidePlugin({
    process: 'process/browser',
  }),
];
