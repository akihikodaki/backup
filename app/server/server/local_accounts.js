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

import { promisify } from 'util';
import LocalAccount from '../models/local_account';
import Person from '../models/person';

async function selectByForeignPersonId(foreign) {
  if (foreign.account) {
    return foreign.account;
  }

  const { rows } = await this.pg.query({
    name: 'local_accounts.selectByForeignPersonId',
    text: 'SELECT * FROM local_accounts WHERE person_id = $1',
    values: [foreign.personId],
  });

  foreign.account = new LocalAccount(rows[0]);

  return foreign.account;
}

export default {
  getInboxChannel({ id }) {
    return `inbox:${id}:streaming`;
  },

  async insertLocalAccount(account) {
    const { rows: [ { id } ] } = await this.pg.query({
      name: 'insertLocalAccount',
      text: 'SELECT insert_local_account($1, $2, $3)',
      values: [account.person.username, account.salt, account.password]
    });

    account.person.id = id;
    account.personId = id;
  },

  async insertIntoInboxes(accounts, item, callback) {
    const activityStreams = JSON.stringify(await item.toActivityStreams());

    const batch = this.redis
                      .publisher
                      .batch(accounts.map(account => [
                        'zadd',
                        `inbox:${account.id}`,
                        item.id,
                        item.id
                      ]).concat(accounts.map(account => [
                        'publish',
                        this.getInboxChannel(account),
                        activityStreams
                      ])));

    return promisifiy(batch.exec.bind(batch));
  },

  selectLocalAccountByAccessToken: selectByForeignPersonId,
  selectLocalAccountByRefreshToken: selectByForeignPersonId,

  async selectLocalAccountsByFollowee({ id }) {
    const { rows } = await this.pg.query({
      name: 'selectLocalAccountsByFollowee',
      text: 'SELECT local_accounts.* FROM local_accounts JOIN follows ON local_accounts.person_id = follows.actor_id WHERE follows.object_id = $1',
      values: [id]
    });

    return rows.map(row => new LocalAccount(row));
  },

  async selectLocalAccountByLowerUsername(lowerUsername) {
    const { rows } = await this.pg.query({
      name: 'selectLocalAccountByLowerUsername',
      text: 'SELECT local_accounts.*, persons.username AS person_username FROM local_accounts JOIN persons ON local_accounts.person_id = persons.id WHERE lower(persons.username) = $1',
      values: [lowerUsername]
    });

    return new LocalAccount({
      person: new Person({ id: person_id, username: person_username }),
      salt,
      password
    });
  }
};
