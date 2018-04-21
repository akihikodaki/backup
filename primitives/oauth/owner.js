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

import AccessToken from '../access_token';

export default {
  async authenticate(repository, token) {
    const { digest, clientSecret } =
      AccessToken.getDigestAndClientSecret(token);

    const accessToken = await repository.selectAccessTokenByDigest(digest);

    if (!accessToken.authenticate(clientSecret)) {
      return null;
    }

    return repository.selectLocalAccountByAccessToken(accessToken);
  },

  parseAuthorization({ headers: { authorization } }) {
    if (typeof authorization != 'string' ||
        !authorization.startsWith('Bearer ')) {
      return null;
    }

    return authorization.slice('Bearer '.length);
  },

  middleware(request, response, next) {
    const token = parseAuthorization(request);

    if (token) {
      authenticate(request.repository, token).then(account => {
        if (account) {
          request.account = account;
          next();
        } else {
          response.append('WWW-Authenticate', 'Bearer error="invalid_token",error_description="The access token provided is expired, revoked, malformed, or invalid for other reasons.",error_uri="https://tools.ietf.org/html/rfc6750#section-3.1"');
          response.sendStatus(401);
        }
      }, error => {
        request.repository.console.log(error);
        response.sendStatus(500);
      });
    } else {
      response.append('WWW-Authenticate', 'Bearer error="invalid_token",error_description="Invalid scheme",error_uri="https://tools.ietf.org/html/rfc6750#section-3.1"');
      response.sendStatus(401);
    }
  }
};
