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

import { init } from 'sapper/runtime';
import Store from '../../primitives/store';
import { routes } from '../manifest/client';

export default node => init(node, routes, {
  store(data) {
    const store = new Store(data);

    if (process.browser) {
      const refreshToken = localStorage.getItem(store.get('refreshTokenKey'));

      if (refreshToken) {
        const username = localStorage.getItem(store.get('usernameKey'));

        store.oauth(fetch, username, {
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        });
      }
    }

    return store;
  }
});
