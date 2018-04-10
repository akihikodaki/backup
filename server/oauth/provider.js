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

const { randomBytes } = require('crypto');
const express = require('express');
const oauth2orize = require('oauth2orize');
const { promisify } = require('util');
const AccessToken = require('../entities/access_token');
const RefreshToken = require('../entities/refresh_token');

const promisifiedRandomBytes = promisify(randomBytes);

module.exports = ({ accessTokens, refreshTokens, users }) => {
  const application = express();
  const oauth2Server = oauth2orize.createServer();

  oauth2Server.exchange(oauth2orize.exchange.password(async (client, username, password, scope, done) => {
    try {
      const user = await users.selectByUsername(username);

      if (!await user.authenticate(password)) {
        done();
        return;
      }

      const buffer = await promisifiedRandomBytes(512);
      const accessTokenServerSecret = buffer.slice(0, 128);
      const accessTokenClientSecret = buffer.slice(128, 256);
      const refreshTokenServerSecret = buffer.slice(256, 384);
      const refreshTokenClientSecret = buffer.slice(384, 512);

      const accessToken = AccessToken.create(
        user,
        accessTokenServerSecret,
        accessTokenClientSecret);

      const refreshToken = RefreshToken.create(
        user,
        refreshTokenServerSecret,
        refreshTokenClientSecret);

      await Promise.all([
        accessTokens.insert(accessToken),
        refreshTokens.insert(refreshToken)
      ]);

      done(
        null,
        accessToken.getToken(accessTokenClientSecret),
        refreshToken.getToken(refreshTokenClientSecret));
    } catch (error) {
      done(error);
    }
  }));

  oauth2Server.exchange(oauth2orize.exchange.refreshToken(async (client, tokenString, scope, done) => {
    try {
      const { id, clientSecret } =
        RefreshToken.getIdAndClientSecret(tokenString);

      const asyncBuffer = promisifiedRandomBytes(512);
      const refreshToken = await refreshTokens.selectById(id);

      if (!refreshToken.authenticate(clientSecret)) {
        done();
        return;
      }

      const user = await users.selectByRefreshToken(refreshToken);
      const buffer = await asyncBuffer;

      const accessTokenServerSecret = buffer.slice(0, 128);
      const accessTokenClientSecret = buffer.slice(128, 256);

      const accessToken = AccessToken.create(
        user,
        accessTokenServerSecret,
        accessTokenClientSecret);

      await accessTokens.insert(accessToken);

      done(null, accessToken.getToken(accessTokenClientSecret));
    } catch (error) {
      console.dir(error);
      done(error);
    }
  }));

  application.post('/token',
    express.urlencoded({ extended: false }),
    oauth2Server.token(),
    oauth2Server.errorHandler());

  return application;
};
