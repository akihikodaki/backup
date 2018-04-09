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
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const pool = require('./pool');

module.exports = {
  insert(token) {
    return pool.query({
      name: 'refresh_tokens.insert',
      text: 'INSERT INTO refresh_tokens (user_id, secret, digest) VALUES ($1, $2, $3) RETURNING id',
      values: [token.user.id, token.secret, token.digest]
    }).then(({ rows }) => token.id = rows[0].id);
  }
};
