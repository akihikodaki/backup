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

import { randomBytes } from 'crypto';
import * as oauth2orize from 'oauth2orize';
import { promisify } from 'util';
import AccessToken from '../models/access_token';
import RefreshToken from '../models/refresh_token';

const promisifiedRandomBytes = promisify(randomBytes);

export async function issue(server, account) {
  const buffer = await promisifiedRandomBytes(512);
  const accessTokenServerSecret = buffer.slice(0, 128);
  const accessTokenClientSecret = buffer.slice(128, 256);
  const refreshTokenServerSecret = buffer.slice(256, 384);
  const refreshTokenClientSecret = buffer.slice(384, 512);

  const accessToken = AccessToken.create(
    account,
    accessTokenServerSecret,
    accessTokenClientSecret);

  const refreshToken = RefreshToken.create(
    account,
    refreshTokenServerSecret,
    refreshTokenClientSecret);

  await Promise.all([
    server.insertAccessToken(accessToken),
    server.insertRefreshToken(refreshToken)
  ]);

  return {
    accessToken: accessToken.getToken(accessTokenClientSecret),
    refreshToken: refreshToken.getToken(refreshTokenClientSecret)
  };
}

export async function refresh(server, account) {
  const buffer = await promisifiedRandomBytes(512);

  const accessTokenServerSecret = buffer.slice(0, 128);
  const accessTokenClientSecret = buffer.slice(128, 256);

  const accessToken = AccessToken.create(
    account, accessTokenServerSecret, accessTokenClientSecret);

  await server.insertAccessToken(accessToken);

  return accessToken.getToken(accessTokenClientSecret);
}

export function createServer(server) {
  const oauthServer = oauth2orize.createServer();

  oauthServer.exchange(oauth2orize.exchange.password(
    async (client, username, password, scope, done) => {
      try {
        const lowerUsername = username.toLowerCase();
        const account =
          await server.selectLocalAccountByLowerUsername(lowerUsername);

        if (!await account.authenticate(password)) {
          done();
          return;
        }

        const { accessToken, refreshToken } = await issue(server, account);

        done(null, accessToken, refreshToken);
      } catch (error) {
        done(error);
      }
    }));

  oauthServer.exchange(oauth2orize.exchange.refreshToken(
    async (client, tokenString, scope, done) => {
      try {
        const { id, clientSecret } =
          RefreshToken.getIdAndClientSecret(tokenString);
        const refreshToken = await server.selectRefreshTokenById(id);

        if (!refreshToken.authenticate(clientSecret)) {
          done();
          return;
        }

        const account =
          await server.selectLocalAccountByRefreshToken(refreshToken);

        done(null, await refresh(server, account));
      } catch (error) {
        server.console.dir(error);
        done(error);
      }
    }));

  return oauthServer;
}
