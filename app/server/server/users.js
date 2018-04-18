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
import User from '../models/user';

async function selectByForeignUserId(foreign) {
  if (foreign.user) {
    return foreign.user;
  }

  const { rows } = await this.pg.query({
    name: 'users.selectByForeignUserId',
    text: 'SELECT * FROM users WHERE id = $1',
    values: [foreign.userId],
  });

  foreign.user = new User(rows[0]);

  return foreign.user;
}

export default {
  async insertUser(user) {
    const { rows } = await this.pg.query({
      name: 'insertUser',
      text: 'INSERT INTO users (salt, username, password) VALUES ($1, $2, $3) RETURNING id',
      values: [user.salt, user.username, user.password]
    });

    user.id = rows[0].id;
  },

  insertIntoInboxes: promisify(function(users, item, callback) {
    this.redis
        .batch(users.map(
           user => ['zadd', `inbox:${user.id}`, item.id, item.id]))
        .exec(callback);
  }),

  selectUserByAccessToken: selectByForeignUserId,
  selectUserByRefreshToken: selectByForeignUserId,

  async selectUserByUsername(username) {
    const { rows } = await this.pg.query({
      name: 'selectUserByUsername',
      text: 'SELECT * FROM users WHERE username = $1',
      values: [username]
    });

    return new User(rows[0]);
  },

  async selectUsersByFollowee({ id }) {
    const { rows } = await this.pg.query({
      name: 'selectUsersByFollowee',
      text: 'SELECT users.* FROM users JOIN follows ON users.id = follows.actor_id WHERE follows.object_id = $1',
      values: [id]
    });

    return rows.map(row => new User(row));
  }
};
