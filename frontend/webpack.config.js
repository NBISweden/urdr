const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const { execSync } = require('child_process')

const gitBranch = process.env.GIT_BRANCH;
const gitHash = process.env.GIT_HASH;

module.exports = {
  mode: 'development',
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
        test: /\.hbs$/,
        loader: 'handlebars-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '...']
  },
  devtool: 'inline-source-map',
  devServer: {
    open: true,
    host: '0.0.0.0',
    port: 4242,
    compress: true,
    allowedHosts: 'all',
    historyApiFallback: true,
    static: './public',
    client: {
      webSocketURL: 'ws://localhost:4567/ws',
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: false
      }
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.PUBLIC_API_URL': JSON.stringify(process.env.PUBLIC_API_URL),
      'process.env.PUBLIC_REDMINE_URL': JSON.stringify(
        process.env.PUBLIC_REDMINE_URL
      ),
      'process.env.GIT_BRANCH': JSON.stringify(gitBranch),
      'process.env.GIT_HASH': JSON.stringify(gitHash)
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      publicPath: '/',
      template: './src/template.hbs'
    })
  ],
  output: {
    filename: './js/index.js',
    path: path.resolve(__dirname, './public')
  }
}
