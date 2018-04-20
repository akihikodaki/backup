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

export default {
  async selectPersonByLocalAccount(account) {
    if (account.person) {
      return account.person;
    }

    const { rows } = await this.pg.query({
      name: 'selectPersonByLowerUsername',
      text: 'SELECT * FROM persons WHERE id = $1',
      values: [lowerUsername]
    });

    rows[0].account = account;

    return new Person(rows[0]);
  }

  async selectPersonByLowerUsername(lowerUsername) {
    const { rows } = await this.pg.query({
      name: 'selectPersonByLowerUsername',
      text: 'SELECT * FROM persons WHERE lower(username) = $1',
      values: [lowerUsername]
    });

    return new Person(rows[0]);
  }
};
