const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  entry: './server.ts',
  devtool: 'source-map',
  target: 'node',
  node: {
    __dirname: true,
  },
  stats: {
    warnings: false,
  },
  module: {
    rules: [
      // {
      //   test: /\.css$/,
      //   use: ['style-loader', 'css-loader'],
      // },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          configFile: './tsconfig.json',
        },
        exclude: /node_modules/,
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
        loader: 'file-loader',
      },
      { enforce: 'post', test: /unicode-properties[\/\\]index.js$/, loader: 'transform-loader?brfs' },
      { enforce: 'post', test: /fontkit[\/\\]index.js$/, loader: 'transform-loader?brfs' },
      { enforce: 'post', test: /linebreak[\/\\]src[\/\\]linebreaker.js/, loader: 'transform-loader?brfs' },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.mjs', '.js', '.json'],
    modules: [`${global}/node_modules`, 'node_modules'],
    plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })],
  },
  optimization: {
    minimize: false,
  },
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, './build'),
  },
};
