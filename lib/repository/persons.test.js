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
import repository from '../test_repository';

describe('loadPerson', () => test('loads person', async () => {
  const inserted = new Person({
    account: new LocalAccount({
      admin: true,
      privateKeyPem: '',
      salt: '',
      serverKey: '',
      storedKey: ''
    }),
    username: 'username',
    host: null
  });

  await repository.insertLocalAccount(inserted.account);

  const unloaded = new Person({ id: inserted.id });
  await repository.loadPerson(unloaded);

  expect(unloaded).toHaveProperty('username', 'username');
  expect(unloaded).toHaveProperty('host', null);
}));
