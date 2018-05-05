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

import Follow from '../follow';
import LocalAccount from '../local_account';
import Person from '../person';
import repository from '../test_repository';

test('inserts and allows to query follow', async () => {
  const loadedFollow = new Follow({
    actor: new Person({
      account: new LocalAccount({
        admin: true,
        privateKeyPem: '',
        salt: '',
        serverKey: '',
        storedKey: ''
      }),
      username: '行動者',
      host: null
    }),
    object: new Person({
      account: new LocalAccount({
        admin: true,
        privateKeyPem: '',
        salt: '',
        serverKey: '',
        storedKey: ''
      }),
      username: '被行動者',
      host: null
    })
  });

  await Promise.all([
    repository.insertLocalAccount(loadedFollow.actor.account),
    repository.insertLocalAccount(loadedFollow.object.account)
  ]);

  await repository.insertFollow(loadedFollow);

  const unloadedFollow = new Follow({ id: loadedFollow.id });
  await repository.loadFollowIncludingActorAndObject(unloadedFollow);

  expect(unloadedFollow).toHaveProperty(['actor', 'username'], '行動者');
  expect(unloadedFollow).toHaveProperty(['actor', 'host'], null);
  expect(unloadedFollow).toHaveProperty(['object', 'username'], '被行動者');
  expect(unloadedFollow).toHaveProperty(['object', 'host'], null);
});
