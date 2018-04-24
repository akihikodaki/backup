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

    this.loadeds.add(account);
    this.loadeds.add(account.person);
  },

  async insertIntoInboxes(accounts, item, callback) {
    const { body } = await item.toActivityStreams();
    body['@context'] = 'https://www.w3.org/ns/activitystreams';

    const string = JSON.stringify(body);

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
                 string
               ])))
               .exec();
  },

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
    }) => {
      const account = new LocalAccount({
        person: new Person({ id: personId }),
        privateKeyPem,
        salt,
        password
      });

      this.loadeds.add(account);
      return account;
    });
  },

  async selectLocalAccountByLowerUsername(lowerUsername) {
    const {
      rows: [ { person_id, person_username, private_key_pem, salt, password } ]
    } = await this.pg.query({
        name: 'selectLocalAccountByLowerUsername',
        text: 'SELECT local_accounts.*, persons.username AS person_username FROM local_accounts JOIN persons ON local_accounts.person_id = persons.id WHERE lower(persons.username) = $1 AND lower(persons.host) = \'\'',
        values: [lowerUsername]
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

    this.loadeds.add(account);
    this.loadeds.add(account.person);

    return account;
  },

  async selectLocalAccountByPerson(person) {
    if (this.loadeds.has(person.account)) {
      return person.account instanceof LocalAccount ? person.account : null;
    }

    const { rows: [ { private_key_pem: privateKeyPem, salt, password } ] } =
      await this.pg.query({
        name: 'selectLocalAccountByPerson',
        text: 'SELECT * FROM local_accounts WHERE person_id = $1',
        values: [person.id],
      });

    if (person.account) {
      person.account.privateKeyPem = privateKeyPem;
      person.account.salt = salt;
      person.account.password = password;
    } else {
      person.account = new LocalAccount({
        person,
        privateKeyPem,
        salt,
        password
      });
    }

    this.loadeds.add(person.account);

    return person.account;
  }
};
