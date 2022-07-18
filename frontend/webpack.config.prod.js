const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: {
    index: './src/index.tsx'
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
        options: {
          transpileOnly: true
        }
      },
      {
        test: /\.(woff|woff2|png|svg|html)$/i,
        type: 'asset'
      },
      {
        test: /\.(css)$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.hbs$/, loader: 'handlebars-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '...']
  },
  optimization: {
    runtimeChunk: {
      name: 'webpack-runtime'
    },
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.PUBLIC_API_URL': JSON.stringify(process.env.PUBLIC_API_URL),
      'process.env.PUBLIC_REDMINE_URL': JSON.stringify(
        process.env.PUBLIC_REDMINE_URL
      )
    }),
    new HtmlWebpackPlugin({
      title: 'Urdr time logging',
      filename: 'index.html',
      publicPath: '/',
      template: './src/template.hbs'
    })
  ],
  output: {
    filename: './js/[name].[contenthash].js',
    assetModuleFilename: './assets/[hash][ext][query]',
    path: path.resolve(__dirname, './public')
  }
}
