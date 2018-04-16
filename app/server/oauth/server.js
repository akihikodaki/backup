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
import AccessToken from '../entities/access_token';
import RefreshToken from '../entities/refresh_token';

const promisifiedRandomBytes = promisify(randomBytes);

export async function issue(repository, user) {
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
    repository.insertAccessToken(accessToken),
    repository.insertRefreshToken(refreshToken)
  ]);

  return {
    accessToken: accessToken.getToken(accessTokenClientSecret),
    refreshToken: refreshToken.getToken(refreshTokenClientSecret)
  };
}

export async function refresh(repository, user) {
  const buffer = await promisifiedRandomBytes(512);

  const accessTokenServerSecret = buffer.slice(0, 128);
  const accessTokenClientSecret = buffer.slice(128, 256);

  const accessToken = AccessToken.create(
    user, accessTokenServerSecret, accessTokenClientSecret);

  await repository.insertAccessToken(accessToken);

  return accessToken.getToken(accessTokenClientSecret);
}

export function createServer(repository) {
  const server = oauth2orize.createServer();

  server.exchange(oauth2orize.exchange.password(
    async (client, username, password, scope, done) => {
      try {
        const user = await repository.selectUserByUsername(username);

        if (!await user.authenticate(password)) {
          done();
          return;
        }

        const { accessToken, refreshToken } = await issue(repository, user);

        done(null, accessToken, refreshToken);
      } catch (error) {
        done(error);
      }
    }));

  server.exchange(oauth2orize.exchange.refreshToken(
    async (client, tokenString, scope, done) => {
      try {
        const { id, clientSecret } =
          RefreshToken.getIdAndClientSecret(tokenString);
        const refreshToken = await repository.selectRefreshTokenById(id);

        if (!refreshToken.authenticate(clientSecret)) {
          done();
          return;
        }

        const user = await repository.selectUserByRefreshToken(refreshToken);

        done(null, await refresh(repository, user));
      } catch (error) {
        console.dir(error);
        done(error);
      }
    }));

  return server;
}
