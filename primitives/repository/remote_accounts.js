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

import Person from '../person';
import RemoteAccount from '../remote_account';

async function selectIncludingPerson(query) {
  const { rows } = await this.pg.query(query);

  return rows[0] ? new RemoteAccount({
    person: new Person({
      id: rows[0].person_id,
      username: rows[0].person_username,
      host: rows[0].person_host || null
     }),
    publicKey: { id: rows[0].key_id, publicKeyPem: rows[0].public_key_pem }
  }) : null;
}

export default {
  async insertRemoteAccount(account) {
    const { rows: [ { id } ] } = await this.pg.query({
      name: 'insertRemoteAccount',
      text: 'SELECT insert_remote_account($1, $2, $3, $4)',
      values: [
        account.person.username,
        account.person.host,
        account.publicKey.id,
        account.publicKey.publicKeyPem
      ]
    });

    account.person.id = id;
    account.personId = id;
  },

  selectRemoteAccountByLowerUsernameAndHost(lowerUsername, lowerHost) {
    return selectIncludingPerson.call(this, {
      name: 'selectRemoteAccountByLowerUsernameAndHost',
      text: 'SELECT remote_accounts.*, persons.username AS person_username, persons.host AS person_host FROM remote_accounts JOIN persons ON remote_accounts.person_id = persons.id WHERE lower(persons.username) = $1 AND lower(persons.host) = $2',
      values: [lowerUsername, lowerHost]
    });
  },

  selectRemoteAccountByKeyId(id) {
    return selectIncludingPerson.call(this, {
      name: 'selectRemoteAccountByKeyId',
      text: 'SELECT remote_accounts.*, persons.username AS person_username, persons.host AS person_host FROM remote_accounts JOIN persons ON remote_accounts.person_id = persons.id WHERE remote_accounts.key_id = $1',
      values: [id]
    });
  },

  async selectRemoteAccountByObjectOfFollow(follow) {
    if (follow.object && follow.object.account) {
      return follow.object.account instanceof RemoteAccount ?
        follow.object.account : null;
    }

    const { rows } = await this.pg.query({
      name: 'selectRemoteAccountByObjectOfFollow',
      text: 'SELECT remote_accounts.* FROM follows JOIN remote_accounts ON follows.object_id = remote_accounts.person_id WHERE follow.id = $1',
      values: [follow.id]
    });

    return new RemoteAccount({
      publicKey: { id: rows[0].key_id, publicKeyPem: rows[0].public_key_pem }
    });
  }
};
