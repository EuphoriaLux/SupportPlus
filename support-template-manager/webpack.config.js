const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    popup: './src/popup.tsx',
    options: './src/options.tsx',
    background: './src/background.ts',
    'content-script': './src/content-script.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: {
          compilerOptions: {
            jsx: 'react-jsx',
            noEmit: false
          },
          // Increase build speed with transpileOnly
          transpileOnly: true
        }
      },
      // Special handling for react-quill-new - use babel-loader instead
      {
        test: /\.js$/,
        include: /node_modules\/react-quill-new/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    // Add alias to easily switch between react-quill and react-quill-new
    alias: {
      'react-quill': 'react-quill-new'
      
    }
  },
  // Add cache for faster rebuilds
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public' },
        { from: 'src/assets', to: 'assets' },
        // Add this to ensure quill.snow.css is copied to the dist directory
        { from: 'node_modules/react-quill-new/dist/quill.snow.css', to: './' }
      ],
    }),
    new HtmlWebpackPlugin({
      template: './src/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: './src/options.html',
      filename: 'options.html',
      chunks: ['options'],
    }),
  ],
};