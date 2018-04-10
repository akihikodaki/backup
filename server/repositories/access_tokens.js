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

const { promisify } = require('util');

function createKey(digest) {
  const buffer = Buffer.allocUnsafe('accessTokens:'.length + digest.byteLength);

  buffer.write('accessTokens:');
  digest.copy(buffer, 'accessTokens:'.length);

  return buffer;
}

module.exports = function() {
  this.accessTokens = {
    insert: promisify((token, callback) => {
      const buffer = Buffer.allocUnsafe(token.secret.byteLength + 4);

      buffer.writeInt32BE(token.user.id, 0);
      token.secret.copy(buffer, 4);

      this.redis.setex(createKey(token.digest), 1048576, buffer, callback);
    }),

    selectByDigest: digest => new Promise((resolve, reject) => {
      this.redis.get(createKey(digest), (error, string) => {
        if (error) {
          reject(error);
        } else {
          const buffer = Buffer.from(string, 'binary');
          resolve({ digest, secret });
        }
      });
    })
  };
};
