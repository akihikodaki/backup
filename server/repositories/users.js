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

const User = require('../entities/user');

module.exports = function() {
  const selectByForeignUserId = async foreign => {
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
  };

  this.users = {
    insert: user => this.pg.query({
      name: 'users.insert',
      text: 'INSERT INTO users (salt, username, password) VALUES ($1, $2, $3) RETURNING id',
      values: [user.salt, user.username, user.password]
    }).then(({ rows }) => user.id = rows[0].id),

    selectByAccessToken: selectByForeignUserId,
    selectByRefreshToken: selectByForeignUserId,

    selectByUsername: username => this.pg.query({
      name: 'users.selectByUsername',
      text: 'SELECT * FROM users WHERE username = $1',
      values: [username]
    }).then(({ rows }) => new User(rows[0]))
  };
};
