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

import AccessToken from '../entities/access_token';

export default async (request, response, next) => {
  try {
    const { authorization } = request.headers;

    if (!authorization.startsWith('Bearer ')) {
      response.append('WWW-Authenticate', 'Bearer error="invalid_token",error_description="Invalid scheme",error_uri="https://tools.ietf.org/html/rfc6750#section-3.1"');
      response.sendStatus(401);
      return;
    }

    const token = authorization.slice('Bearer '.length);
    const { digest, clientSecret } =
      AccessToken.getDigestAndClientSecret(token);

    const accessToken = await request.repository.selectAccessTokenByDigest(digest);

    if (!accessToken.authenticate(clientSecret)) {
      response.append('WWW-Authenticate', 'Bearer error="invalid_token",error_description="The access token provided is expired, revoked, malformed, or invalid for other reasons.",error_uri="https://tools.ietf.org/html/rfc6750#section-3.1"');
      response.sendStatus(401);
      return;
    }

    request.user = await request.repository.selectUserByAccessToken(accessToken);
  } catch (error) {
    console.error(error);
    response.sendStatus(500);
    return;
  }

  next();
};
