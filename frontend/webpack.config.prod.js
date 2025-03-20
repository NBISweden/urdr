const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const gitBranch = process.env.GIT_BRANCH
const gitHash = process.env.GIT_HASH

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
    moduleIds: 'deterministic',
    runtimeChunk: {
      name: 'webpack-runtime'
    },
    splitChunks: {
      name: false,
      chunks: 'all',
      maxInitialRequests: 25,
      cacheGroups: {
        commons: {
          test (module) {
            const moduleFileName = module
              .identifier()
              .split('/')
              .reduceRight((item) => item)
            return (
              moduleFileName.split('.').pop() !== 'css' &&
              module.size() > 80000)
          },
          name (module, chunks, cacheGroupKey) {
            const moduleFileName = module
              .identifier()
              .split('/')
              .reduceRight((item) => item)
            const allChunksNames = chunks.map((item) => item.name).join('~')
            return `${cacheGroupKey}-${allChunksNames}-${moduleFileName}`
          }
        }
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
    filename: './js/[name].[contenthash].js',
    assetModuleFilename: './assets/[hash][ext][query]',
    path: path.resolve(__dirname, './public')
  }
}
