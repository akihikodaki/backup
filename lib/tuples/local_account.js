/*
  Copyright (C) 2018  Miniverse authors

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

import { domainToASCII } from 'url';
import Actor from './actor';
import Relation, { withRepository } from './relation';
import { generate } from './key';
import { encodeAcctUserpart } from './uri';

export default class LocalAccount extends Relation {
  async toWebFinger() {
    const actor = await this.select('actor');
    const encodedUserpart = encodeAcctUserpart(actor.username);
    const encodedHost = domainToASCII(this.repository.fingerHost);

    return {
      subject: `acct:${encodedUserpart}@${encodedHost}`,
      links: [
        {
          rel: 'self',
          type: 'application/activity+json',
          href: await actor.getUri(),
        }
      ]
    };
  }

  static async create(repository, username, name, summary, admin, salt, serverKey, storedKey) {
    const account = new this({
      repository,
      actor: new Actor({ repository, username, host: null, name, summary }),
      admin,
      privateKeyPem: generate(),
      salt,
      serverKey,
      storedKey
    });

    account.actor.validate();
    await repository.insertLocalAccount(account);

    return account;
  }
}

LocalAccount.references = {
  inbox: {
    query: withRepository('selectRecentStatusesIncludingExtensionsAndActorsFromInbox'),
    id: 'id'
  },
  actor: {
    query: withRepository('selectActorById'),
    id: 'id',
    inverseOf: 'account'
  }
};