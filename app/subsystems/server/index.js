/*
  Copyright (C) 2018  Akihiko Odaki <nekomanma@pixiv.co.jp>

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

import { createServer } from 'http';
import sapper from 'sapper';
import Store from '../../../primitives/store';
import { routes } from '../../manifest/server';
import createStreaming from './streaming';
const Arena = require('bull-arena');
const express = require('express');

export default (repository, port) => {
  const application = express();
  const server = createServer(application);

  createStreaming(repository, server);

  application.use(
    express.static('assets'),
    (request, response, next) => {
      request.repository = repository;
      next();
    },
    Arena({
      queues: [
        { hostId: repository.host, name: 'HTTP', url: repository.redis.url }
      ]
    }, { basePath: '/bull', disableListen: true }),
    sapper({
      routes,
      store() {
        return new Store({
          accessToken: null,
          refreshTokenKey: 'activeNode.refreshToken',
          user: null,
          usernameKey: 'activeNode.username',
          streaming: null
        });
      }
    }));

  server.listen(port).on('error', repository.console.error);

  return server;
};
