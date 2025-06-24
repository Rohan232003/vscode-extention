const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development', // or 'production'
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/, 
        use: ['style-loader', 'css-loader'],
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', 
      filename: 'index.html',
    }),
  ],
  devtool: 'eval-source-map', // or 'source-map' for production
};
