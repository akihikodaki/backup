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

import { urlencoded } from 'express';
import User from '../../app/server/models/user';
import { issue } from '../../app/server/oauth/server';

const urlencodedMiddleware = urlencoded({ extended: false });

export function post(request, response) {
  urlencodedMiddleware(request, response, () => {
    const { body, server } = request;

    User.create(body.username, body.password).then(async user => {
      await server.insertUser(user);
      const { accessToken, refreshToken } = await issue(server, user);

      return {
        token_type: 'Bearer',
        access_token: accessToken,
        refresh_token: refreshToken
      };
    }).then(body => response.json(body), error => {
      console.error(error);
      response.sendStatus(500);
    });
  });
}
