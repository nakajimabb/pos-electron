const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'postcss-loader' }],
});

// rules.push({
//   test: /\.svg$/,
//   use: [
//     {
//       loader: 'babel-loader',
//     },
//     {
//       loader: 'react-svg-loader',
//     },
//   ],
// });

module.exports = {
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    fallback: {
      process: require.resolve('process/browser'),
      assert: require.resolve('assert'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util'),
      zlib: require.resolve('browserify-zlib'),
    },
  },
};
