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
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const { createHmac, timingSafeEqual } = require('crypto');

function digest(secret, data) {
  /*
     Choose SHA-384 because it could be relatively fast even for
     generic computers with Intel CPU thanks to SHA extensions.
     Intel® SHA Extensions | Intel® Software
     https://software.intel.com/en-us/articles/intel-sha-extensions
  */
  const hmac = createHmac('sha384', data);
  hmac.update(secret);

  return hmac.digest();
}

module.exports = class {
  constructor({ id, user, secret, digest }) {
    this.user = user;
    this.secret = secret;
    this.digest = digest;
  }

  authenticate(clientSecret) {
    return timingSafeEqual(digest(this.secret, clientSecret), this.digest);
  }

  getToken(clientSecret) {
    return Buffer.concat([this.digest, clientSecret]).toString('base64');
  }

  static create(user, secret, clientSecret) {
    return new this({ user, secret, digest: digest(secret, clientSecret) });
  }

  static getDigestAndClientSecret(tokenString) {
    const buffer = Buffer.from(tokenString, 'base64');

    return {
      digest: buffer.slice(0, 48),
      clientSecret: buffer.slice(48)
    };
  }
};
