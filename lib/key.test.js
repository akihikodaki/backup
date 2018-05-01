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

import Key from './key';
import LocalAccount from './local_account';
import Person from './person';
import repository from './test_repository';

describe('getUri', () => {
  test('loads and returns URI of local key', async () => {
    const owner = new Person({
      account: new LocalAccount({ 
        admin: true,
        privateKeyPem: '',
        salt: '',
        serverKey: '',
        storedKey: ''
      }),
      username: 'owner',
      host: null
    });

    await repository.insertLocalAccount(owner.account);

    const key = new Key({ owner: new Person({ id: owner.id }) });

    await expect(key.getUri(repository))
      .resolves
      .toBe('https://origin.example.com/@owner#key');
  });
});
