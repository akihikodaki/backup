/*
  Copyright (C) 2019  Miniverse authors

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, version 3 of the License.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const LicenseChecker = require('@jetbrains/ring-ui-license-checker');
const { join } = require('path');
const { BannerPlugin } = require('webpack');
const { dependencies } = require('./package');

const context = join(__dirname, 'src');
const extensions = ['.ts', '.tsx', '.js'];

const nodeExternals = Object.create(null);
nodeExternals['isomorphism/url'] = 'commonjs url';
nodeExternals['react-native'] = 'commonjs react-native-web';

const reactNativeVectorIconsRule = {
  test: /node_modules\/react-native-vector-icons\/.*\.js$/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['@babel/preset-react'],
      plugins: ['@babel/plugin-proposal-class-properties']
    }
  }
};

module.exports = function(env, { mode }) {
  const browser = {
    context,
    devtool: 'source-map',
    entry: ['react-native-vector-icons/Fonts/MaterialIcons.ttf', './app'],
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: {
            loader: 'ts-loader',
            options: { configFile: '../browser.tsconfig.json' }
          }
        },
        {
          test: /node_modules\/react-native-vector-icons\/Fonts\/MaterialIcons\.ttf$/,
          use: {
            loader: 'file-loader',
            options: { name: '[name].[ext]' }
          }
        },
        reactNativeVectorIconsRule
      ]
    },
    output: { path: join(__dirname, 'static') },
    resolve: {
      alias: {
        isomorphism: join(context, 'lib/isomorphism/browser'),
        'react-native$': 'react-native-web'
      },
      extensions
    }
  };

  const node = {
    context,
    devtool: 'source-map',
    entry: { process: './process', serve: './serve' },
    externals(_context, request, callback) {
      const external = nodeExternals[request];
      if (external) {
        return callback(null, external);
      }

      if (request in dependencies) {
        return callback(null, 'commonjs ' + request);
      }

      for (const key in dependencies) {
        if (request.startsWith(key + '/')) {
          return callback(null, 'commonjs ' + request);
        }
      }

      callback();
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: {
            loader: 'ts-loader',
            options: { configFile: '../node.tsconfig.json' }
          }
        },
        reactNativeVectorIconsRule
      ]
    },
    node: false,
    plugins: [new BannerPlugin({ banner: '#!/usr/bin/env node', raw: true })],
    resolve: {
      alias: { isomorphism: join(context, 'lib/isomorphism/node') },
      extensions
    },
    target: 'node'
  };

  if (mode == 'production') {
    browser.plugins = [
      new LicenseChecker({
        filename: './license.html'
      })
    ];
  }

  return [browser, node];
};
