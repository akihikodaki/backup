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
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const { randomBytes } = require('crypto');
const express = require('express');
const oauth2orize = require('oauth2orize');
const RefreshToken = require('./entities/refresh_token');
const User = require('./entities/user');
const refreshTokens = require('./repositories/refresh_tokens');
const users = require('./repositories/users');

const oauth2Server = oauth2orize.createServer();

oauth2Server.exchange(oauth2orize.exchange.password(async (client, username, password, scope, done) => {
  try {
    const attributes = await users.selectByUsername(username);
    const user = new User(attributes);

    if (!await user.authenticate(password)) {
      done();
      return;
    }

    const refreshTokenBuffer = await new Promise((resolve, reject) => {
      randomBytes(256, (error, buffer) => {
        if (error) {
          reject(error);
        } else {
          resolve(buffer);
        }
      });
    });

    const refreshTokenServerSecret = refreshTokenBuffer.slice(0, 128);
    const refreshTokenClientSecret = refreshTokenBuffer.slice(128, 256);
    const refreshToken = RefreshToken.create(
      user,
      refreshTokenServerSecret,
      refreshTokenClientSecret);

    await refreshTokens.insert(refreshToken);

    done(null, 'accessToken', refreshToken.getToken(refreshTokenClientSecret));
  } catch (error) {
    done(error);
  }
}));

module.exports = () => {
  const application = express();

  application.post('/token',
    express.urlencoded({ extended: false }),
    oauth2Server.token(),
    oauth2Server.errorHandler());

  return application;
};
