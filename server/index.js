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

const express = require('express');
const { createServer } = require('http');
const createApi = require('./api');
const createApiStreaming = require('./api/streaming');
const createOauthProvider = require('./oauth/provider');
const Repository = require('./repository');
const createUser = require('./user');

module.exports = redis => {
  const application = express();
  const repository = new Repository(redis);
  const server = createServer(application);
  const apiStreaming = createApiStreaming(repository);

  application.use('/api', createApi(repository));
  application.use('/oauth', createOauthProvider(repository));
  application.use(createUser(repository));
  application.use(express.static('dist'));

  server.on('upgrade', (request, socket, head) => {
    if (request.url == '/api/v0/streaming') {
      apiStreaming.handleUpgrade(request, socket, head, connection => {
        apiStreaming.emit('connection', connection);
      });
    } else {
      socket.destroy();
    }
  });

  return server;
};
