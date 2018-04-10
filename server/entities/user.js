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

const { pbkdf2, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');

const promisifiedPbkdf2 = promisify(pbkdf2);
const promisifiedRandomBytes = promisify(randomBytes);

function hashPassword(rawPassword, salt) {
  /*
     NIST Special Publication 800-63B
     Digital Identity Guidelines
     Authentication and Lifecycle Management
     5. Authenticator and Verifier Requirements
     https://pages.nist.gov/800-63-3/sp800-63b.html#sec5
     > Secrets SHALL be hashed with a salt value using an approved
     > hash function such as PBKDF2 as described in [SP 800-132].
     > At least 10,000 iterations of the hash function SHOULD be
     > performed.

     Choose SHA-384 because it could be relatively fast even for
     generic computers with Intel CPU thanks to SHA extensions.
     Intel® SHA Extensions | Intel® Software
     https://software.intel.com/en-us/articles/intel-sha-extensions
  */
  return promisifiedPbkdf2(rawPassword, salt, 16384, 128, 'sha384');
}

module.exports = class {
  constructor({ id, salt, username, password }) {
    this.id = id;
    this.salt = salt;
    this.username = username;
    this.password = password;
  }

  async authenticate(rawPassword) {
    const hashedPassword = await hashPassword(rawPassword, this.salt);
    return timingSafeEqual(this.password, hashedPassword);
  }

  static async create(username, rawPassword) {
    const salt = await promisifiedRandomBytes(128);
    const password = await hashPassword(rawPassword, salt);

    return new this({ salt, username, password });
  }
};
