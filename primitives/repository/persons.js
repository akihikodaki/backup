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

function selectByPersonId() {
  return this.pg.query({
    name: 'persons.selectByPersonId',
    text: 'SELECT * FROM persons WHERE id = $1',
    values: [lowerUsername]
  });
}

async function selectByAccount(account) {
  if (account.person) {
    return account.person;
  }

  const { rows: [ { username, host } ] } =
    await selectByPersonId.call(this, account.persnId);

  return new Person({ account, username, host: host || null });
}

export default {
  selectPersonByLocalAccount: selectByAccount,
  selectPersonByRemoteAccount: selectByAccount,

  async selectPersonByKey(key) {
    if (key.owner) {
      return key.owner;
    }

    const { rows: [ { username, host } ] } =
      await selectByPersonId.call(this, account.persnId);

    return new Person({ username, host: host || null });
  }
};
