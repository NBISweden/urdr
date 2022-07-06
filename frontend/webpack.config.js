const path = require('path');

 module.exports = {
   mode: 'development',
   entry: {
     index: './src/index.tsx',
   },
    module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
        options: {
          transpileOnly: true
        },
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },
      {
        test: /\.(css)$/i,
        use: ["style-loader", "css-loader"],
      }

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
   resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".css", ".html", "..."],
  },
   devtool: 'inline-source-map',
   devServer: {
    open: true,
    host: "0.0.0.0",
    port: 4242,
    compress: true,
    allowedHosts: "all",
    historyApiFallback: true,
    static: "./public",
  },
   plugins: [],
   output: {
     filename: 'bundle.js',
     path: path.resolve(__dirname, './public'),
     clean: true,
   },
 };
