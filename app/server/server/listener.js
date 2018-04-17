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
import { routes } from '../../manifest/server.js';
import Store from '../../store';
import Streaming from './streaming';
const express = require('express');

export default {
  listen(port) {
    const application = express();
    const server = createServer(application);

    Streaming.create.call(this, server);

    application.use(
      express.static('assets'),
      (request, response, next) => {
        request.server = this;
        next();
      },
      sapper({
        routes,
        store() {
          return new Store({
            persons: Object.create(null),
            sessionAccessToken: null,
            sessionRefreshTokenKey: 'activeNode.session.refreshToken',
            sessionUsername: null,
            sessionUsernameKey: 'activeNode.session.username',
            streaming: null
          });
        }
      }));

    server.listen(port).on('error', this.console.error);

    return server;
  }
};
