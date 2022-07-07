const path = require('path')
const webpack = require('webpack')

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
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif|html)$/i,
        type: 'asset'
      },
      {
        test: /\.(css)$/i,
        use: ['style-loader', 'css-loader']
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
      webSocketURL: 'ws://localhost:4567/ws'
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.PUBLIC_API_URL': JSON.stringify(process.env.PUBLIC_API_URL),
      'process.env.PUBLIC_REDMINE_URL': JSON.stringify(
        process.env.PUBLIC_REDMINE_URL
      )
    })
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './public')
  }
}
