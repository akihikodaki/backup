#!/usr/bin/env node

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

const { fork } = require('child_process');
const webpack = require('webpack');
const createConfigs = require('./webpack.config');

const configs = createConfigs(process.env, { mode: 'development' });
let child;

for (const config of configs) {
  config.mode = 'development';
}

webpack(configs).watch({}, (error, stats) => {
  if (error) {
    console.error(error);

    if (error.details) {
      console.log(error.details);
    }
  } else {
    if (child) {
      child.kill();
    }

    child = fork('./dist/serve', { stdio: 'inherit' });
  }

  console.log(stats.toString({ colors: true }));
});
