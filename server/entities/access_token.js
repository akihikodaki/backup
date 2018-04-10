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

const base64url = require('base64url');
const Token = require('./token');

module.exports = class extends Token {
  getToken(clientSecret) {
    return base64url(Buffer.concat([this.digest, clientSecret]));
  }

  static getDigestAndClientSecret() {
    const buffer = base64url.toBuffer(tokenString);

    return {
      digest: buffer.slice(0, 48),
      clientSecret: buffer.slice(48)
    };
  }
}
