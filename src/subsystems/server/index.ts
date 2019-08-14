/*
  Copyright (C) 2018  Miniverse authors

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

import { join } from 'path';
import Repository from '../../lib/repository';
import app from './app';
import gate from './gate';
import plain from './plain/middleware';
import routes from './routes';
import { Application } from './types';
import Arena = require('bull-arena');
import express = require('express');

export default function (repository: Repository): Application {
  const application = express();

  application.locals.repository = repository;

  application.use('/static', express.static(join(__dirname, '../static')));

  application.use(
    gate,
    Arena({
      queues: [
        {
          hostId: repository.host,
          name: 'HTTP',
          prefix: repository.redis.prefix + 'bull',
          url: repository.redis.url
        }
      ]
    }, { basePath: '/bull', disableListen: true }),
    plain,
    routes(),
    app);

  return application;
}
