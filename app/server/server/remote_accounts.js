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

import Person from '../models/person';
import RemoteAccount from '../models/remote_account';

export default {
  async insertRemoteAccount(account) {
    const { rows: [ { id } ] } = await this.pg.query({
      name: 'insertRemoteAccount',
      text: 'SELECT insert_remote_account($1, $2)',
      values: [account.person.username, account.host]
    });

    account.person.id = id;
    account.personId = id;
  },

  async selectRemoteAccountByLowerUsernameAndHost(lowerUsername, lowerHost) {
    const { rows } = await this.pg.query({
      name: 'selectRemoteAccountByLowerUsernameAndHost',
      text: 'SELECT remote_accounts.*, persons.username AS person_username FROM remote_accounts JOIN persons ON remote_accounts.person_id = persons.id WHERE lower(persons.username) = $1 AND lower(remote_accounts.host) = $2',
      values: [lowerUsername, lowerHost]
    });

    return rows[0] ? new RemoteAccount({
      person: new Person({
        id: rows[0].person_id,
        username: rows[0].person_username
       }),
      host: rows[0].host,
    }) : null;
  },

  async selectRemoteAccountByPerson({ id }) {
    const { rows: [ { person_id: personId, host } ] } = await this.pg.query({
      name: 'selectRemoteAccountByPerson',
      text: 'SELECT * FROM remote_accounts WHERE person_id = $1',
      values: [id]
    });

    return new RemoteAccount({ personId, host });
  }
};
