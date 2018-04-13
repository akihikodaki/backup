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
import serve from 'serve-static';
import { routes } from '../manifest/server.js';
import Store from '../store';
import createOauth from './oauth/server';
import Repository from './repository';
import createStreaming from './streaming';
const express = require('express');

export default redis => {
  const application = express();
  const repository = new Repository(redis);
  const oauthServer = createOauth(repository);
  const streaming = createStreaming(repository);
  const server = createServer(application);
  const oauth = {
    token: oauthServer.token(),
    errorHandler: oauthServer.errorHandler()
  };

  application.use(
    serve('assets'),
    (request, response, next) => {
      request.oauth = oauth;
      request.repository = repository;
      next();
    },
    sapper({
      routes,
      store() {
        return new Store({
          persons: Object.create(null),
          sessionAccessToken: null,
          sessionUsername: null,
          streaming: null
        });
      }
    }));

  server.on('upgrade', (request, socket, head) => {
    if (request.url == '/api/v0/streaming') {
      streaming.handleUpgrade(request, socket, head, connection => {
        streaming.emit('connection', connection);
      });
    } else {
      socket.destroy();
    }
  });

  return server;
};
