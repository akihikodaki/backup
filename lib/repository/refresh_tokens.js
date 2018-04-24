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

import RefreshToken from '../refresh_token';
import LocalAccount from '../local_account';
import Person from '../person';

export default {
  async insertRefreshToken(token) {
    const { rows } = await this.pg.query({
      name: 'insertRefreshToken',
      text: 'INSERT INTO refresh_tokens (person_id, secret, digest) VALUES ($1, $2, $3) RETURNING id',
      values: [token.personId, token.secret, token.digest]
    });

    token.id = rows[0].id;
    this.loadeds.add(token);
  },

  async selectRefreshTokenById(id) {
    const { rows: [{ person_id, secret, digest }] } = await this.pg.query({
      name: 'selectRefreshTokenById',
      text: 'SELECT * FROM refresh_tokens WHERE id = $1',
      values: [id]
    });

    const token = new RefreshToken({
      id,
      account: new LocalAccount({ person: new Person({ id: person_id }) }),
      secret,
      digest
    });

    this.loadeds.add(token);
    return token;
  }
};
