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

import { pbkdf2, randomBytes, timingSafeEqual } from 'crypto';
import { toASCII } from 'punycode';
import { promisify } from 'util';
import { generate } from '../key';
import Person from './person';
import URI from './uri';

const promisifiedRandomBytes = promisify(randomBytes);

const hashPassword = promisify((rawPassword, salt, callback) => {
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
  return pbkdf2(rawPassword, salt, 16384, 128, 'sha384', callback);
});

export default class {
  constructor({ person, personId, privateKeyPem, salt, password }) {
    if (person) {
      person.account = this;
      this.person = person;
      this.personId = person.id;
    } else {
      this.personId = personId;
    }

    this.privateKeyPem = privateKeyPem;
    this.salt = salt;
    this.password = password;
  }

  async toWebFinger(repository) {
    const { username } = await repository.selectPersonByLocalAccount(this);
    const uriUsername = URI.encodeSegment(username);

    return {
      subject: `acct:${uriUsername.replace(/:/g, '%3A').replace(/@/g, '%40')}@${toASCII(repository.host)}`,
      links: [
        {
          rel: 'self',
          type: 'application/activity+json',
          href: `${repository.origin}/@${uriUsername}`,
        }
      ]
    };
  }

  async authenticate(rawPassword) {
    const hashedPassword = await hashPassword(rawPassword, this.salt);
    return timingSafeEqual(this.password, hashedPassword);
  }

  static async create(repository, username, rawPassword) {
    const salt = await promisifiedRandomBytes(128);
    const password = await hashPassword(rawPassword, salt);

    const account = new this({
      person: new Person({ username, host: null }),
      privateKeyPem: generate(),
      salt,
      password
    });

    await repository.insertLocalAccount(account);

    return account;
  }
};
