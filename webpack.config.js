const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = (env, argv) => {
  return {
  // Where files should be sent once they are bundled
 output: {
   path: path.join(__dirname, '/dist'),
   filename: 'index.bundle.js'
 },
  // webpack 5 comes with devServer which loads in development mode
 devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 3000,
    open: true,
    hot: true
  },
  // Rules of how webpack will take our files, complie & bundle them for the browser
 module: {
   rules: [
     {
        test: /\.(jsx|js)$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                "targets": {
                  "node": "12"
                }
              }],
              '@babel/preset-react'
            ]
          }
        }]
     },
     {
      test: /\.css$/,
      use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "postcss-loader",
      ],
  },
   ]
 },
 plugins: [
     new HtmlWebpackPlugin({ template: './src/index.html' }),
     new MiniCssExtractPlugin(),
     new Dotenv(),
     new webpack.HotModuleReplacementPlugin(),
     new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
     }),
     new webpack.ProvidePlugin({
        process: 'process/browser',
     }),
 ],
 resolve: {
    fallback: {
      assert: require.resolve('assert'),
      crypto: require.resolve('crypto-browserify'),
      os: require.resolve("os-browserify/browser"),
      stream: require.resolve("stream-browserify"),
      url: require.resolve("url"),
      https: require.resolve("https-browserify"),
      http: require.resolve("stream-http")
    },
 },
}
}
