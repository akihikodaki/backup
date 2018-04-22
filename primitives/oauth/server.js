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
import AccessToken from '../access_token';
import RefreshToken from '../refresh_token';

const promisifiedRandomBytes = promisify(randomBytes);

export default {
  async issue(repository, account) {
    const buffer = await promisifiedRandomBytes(512);
    const accessTokenServerSecret = buffer.slice(0, 128);
    const accessTokenClientSecret = buffer.slice(128, 256);
    const refreshTokenServerSecret = buffer.slice(256, 384);
    const refreshTokenClientSecret = buffer.slice(384, 512);

    const [accessToken, refreshToken] = await Promise.all([
      AccessToken.create(
        repository, account, accessTokenServerSecret, accessTokenClientSecret),
      RefreshToken.create(
        repository, account, refreshTokenServerSecret, refreshTokenClientSecret)
    ]);

    return {
      accessToken: accessToken.getToken(accessTokenClientSecret),
      refreshToken: refreshToken.getToken(refreshTokenClientSecret)
    };
  },

  async refresh(repository, account) {
    const buffer = await promisifiedRandomBytes(512);

    const accessTokenServerSecret = buffer.slice(0, 128);
    const accessTokenClientSecret = buffer.slice(128, 256);

    const accessToken = await AccessToken.create(
      repository, account, accessTokenServerSecret, accessTokenClientSecret);

    return accessToken.getToken(accessTokenClientSecret);
  },

  create(repository) {
    const oauthServer = oauth2orize.createServer();

    oauthServer.exchange(oauth2orize.exchange.password(
      async (client, username, password, scope, done) => {
        try {
          const lowerUsername = username.toLowerCase();
          const account =
            await repository.selectLocalAccountByLowerUsername(lowerUsername);

          if (!await account.authenticate(password)) {
            done();
            return;
          }

          const { accessToken, refreshToken } =
            await issue(repository, account);

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
          const refreshToken = await repository.selectRefreshTokenById(id);

          if (!refreshToken.authenticate(clientSecret)) {
            done();
            return;
          }

          const account =
            await repository.selectLocalAccountByRefreshToken(refreshToken);

          done(null, await refresh(repository, account));
        } catch (error) {
          repository.console.dir(error);
          done(error);
        }
      }));

    return oauthServer;
  }
}
