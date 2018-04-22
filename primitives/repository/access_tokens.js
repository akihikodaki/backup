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

function createKey(digest) {
  const buffer = Buffer.allocUnsafe('accessTokens:'.length + digest.byteLength);

  buffer.write('accessTokens:');
  digest.copy(buffer, 'accessTokens:'.length);

  return buffer;
}

export default {
  insertAccessToken(token) {
    const buffer = Buffer.allocUnsafe(token.secret.byteLength + 4);
    const key = createKey(token.digest);

    buffer.writeInt32BE(token.personId, 0);
    token.secret.copy(buffer, 4);

    return this.redis.client.setex(key, 1048576, buffer);
  },

  async selectAccessTokenByDigest(digest) {
    const string = await this.redis.client.get(createKey(digest));
    const buffer = Buffer.from(string, 'binary');

    return new AccessToken({
      digest,
      personId: buffer.readInt32BE(0),
      secret: buffer.slice(4)
    });
  }
};
