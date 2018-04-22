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

import Token from './token';
const base64url = require('base64url');

export default class extends Token {
  constructor(attributes) {
    super(attributes);
    this.id = attributes.id;
  }

  getToken(clientSecret) {
    const buffer = Buffer.allocUnsafe(clientSecret.byteLength + 4);

    buffer.writeInt32BE(this.id, 0);
    clientSecret.copy(buffer, 4);

    return base64url(buffer);
  }

  static async create(repository, account, secret, clientSecret) {
    const token = super.create(account, secret, clientSecret);
    await repository.insertRefreshToken(token);
    return token;
  }

  static getIdAndClientSecret(tokenString) {
    const buffer = base64url.toBuffer(tokenString);

    return {
      id: buffer.readInt32BE(0),
      clientSecret: buffer.slice(4)
    };
  }
};
