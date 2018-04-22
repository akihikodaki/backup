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

import LocalAccount from '../local_account';
import Person from '../person';

async function selectByPersonId(personId) {
  const { rows: [ { private_key_pem: privateKeyPem, salt, password } ] } =
    await this.pg.query({
      name: 'local_accounts.selectByPersonId',
      text: 'SELECT * FROM local_accounts WHERE person_id = $1',
      values: [personId],
    });

  return new LocalAccount({ personId, privateKeyPem, salt, password });
}

async function selectByForeignPersonId(foreign) {
  if (foreign.account) {
    return foreign.account;
  }

  foreign.account = await selectByPersonId.call(this, foreign.personId);

  return foreign.account;
}

export default {
  getInboxChannel({ id }) {
    return `inbox:${id}:streaming`;
  },

  async insertLocalAccount(account) {
    const { rows: [ { insert_local_account } ] } = await this.pg.query({
      name: 'insertLocalAccount',
      text: 'SELECT insert_local_account($1, $2, $3, $4)',
      values: [
        account.person.username,
        account.privateKeyPem,
        account.salt,
        account.password
      ]
    });

    account.person.id = insert_local_account;
    account.personId = insert_local_account;
  },

  async insertIntoInboxes(accounts, item, callback) {
    const activityStreams = JSON.stringify(await item.toActivityStreams());

    return this.redis
               .publisher
               .pipeline(accounts.map(account => [
                 'zadd',
                 `inbox:${account.id}`,
                 item.id,
                 item.id
               ]).concat(accounts.map(account => [
                 'publish',
                 this.getInboxChannel(account),
                 activityStreams
               ])))
               .exec();
  },

  selectLocalAccountByAccessToken: selectByForeignPersonId,
  selectLocalAccountByRefreshToken: selectByForeignPersonId,

  async selectLocalAccountsByFollowee({ id }) {
    const { rows } = await this.pg.query({
      name: 'selectLocalAccountsByFollowee',
      text: 'SELECT local_accounts.* FROM local_accounts JOIN follows ON local_accounts.person_id = follows.actor_id WHERE follows.object_id = $1',
      values: [id]
    });

    return rows.map(({
      person_id: personId,
      private_key_pem: privateKeyPem,
      salt,
      password
    }) => new LocalAccount({ personId, privateKeyPem, salt, password }));
  },

  async selectLocalAccountByLowerUsername(lowerUsername) {
    const {
      rows: [ { person_id, person_username, private_key_pem, salt, password } ]
    } = await this.pg.query({
        name: 'selectLocalAccountByLowerUsername',
        text: 'SELECT local_accounts.*, persons.username AS person_username FROM local_accounts JOIN persons ON local_accounts.person_id = persons.id WHERE lower(persons.username) = $1 AND lower(persons.host) = \'\'',
        values: [lowerUsername]
      });

    return new LocalAccount({
      person: new Person({
        id: person_id,
        username: person_username,
        host: null
      }),
      privateKeyPem: private_key_pem,
      salt,
      password
    });
  },

  async selectLocalAccountByPerson(person) {
    if (person.account) {
      return person.account;
    }

    const account = await selectByPersonId(person.id);

    account.person = person;
    person.account = account;

    return account;
  },

  async selectLocalAccountIncludingPersonByActorOfFollow(follow) {
    if (follow.actor && follow.actor.account) {
      return follow.actor.account instanceof LocalAccount ?
        follow.actor.account : null;
    }

    const {
      rows: [ { person_id, person_username, private_key_pem, salt, password } ]
    } = await this.pg.query({
      name: 'selectLocalAccountIncludingPersonByActorOfFollow',
      text: 'SELECT local_accounts.*, persons.username AS person_username FROM local_accounts JOIN persons ON local_accounts.person_id = persons.id JOIN follow ON local_accounts.person_id = follow.actor_id WHERE follow.id = $1',
      values: [follow.id]
    });

    const account = new LocalAccount({
      person: new Person({
        id: person_id,
        username: person_username,
        host: null
      }),
      privateKeyPem: private_key_pem,
      salt,
      password
    });

    follow.actor = account.person;

    return account;
  }
};
