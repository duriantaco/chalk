const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    chunkFilename: 'chunk.[contenthash].js',
    publicPath: '', 
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/, 
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { presets: ['@babel/preset-env', '@babel/preset-react'] }
        }
      },
      { 
        test: /\.css$/, 
        use: [
          isProd ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader', 
          'postcss-loader'
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico|woff2?|ttf|eot)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/[name].[contenthash][ext]' }
      }
    ]
  },
  resolve: { extensions: ['.js', '.jsx'] },
  plugins: [
    new HtmlWebpackPlugin({
      inject: 'body',
      scriptLoading: 'defer',
      templateContent: () => `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Chalk</title>
          </head>
          <body>
            <div id="root"></div>
          </body>
        </html>
      `,
      minify: false
    }),
    ...(isProd ? [new MiniCssExtractPlugin({ filename: 'styles.[contenthash].css' })] : [])
  ],
  optimization: {
    minimize: isProd,
    minimizer: [
      new TerserPlugin({
        extractComments: false
      }),
      new CssMinimizerPlugin()
    ]
  },
  devtool: isProd ? false : 'eval-cheap-module-source-map'
};