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

import Accept from './accept';
import Follow from './follow';
import LocalAccount from './local_account';
import Person from './person';
import repository from './test_repository';

describe('toActivityStreams', () => {
  test('returns ActivityStreams representation', async () => {
    const accept = new Accept({
      follow: new Follow({
        actor: new Person({
          account: new LocalAccount({ 
            admin: true,
            privateKeyPem: '',
            salt: '',
            serverKey: '',
            storedKey: ''
          }),
          username: 'actor',
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
          username: 'object',
          host: null
        })
      })
    });

    await Promise.all([
      repository.insertLocalAccount(accept.follow.actor.account),
      repository.insertLocalAccount(accept.follow.object.account)
    ]);

    await repository.insertFollow(accept.follow);

    expect((await accept.toActivityStreams(repository)).body).toEqual({
      type: 'Accept',
      object: {
        type: 'Follow',
        actor: 'https://origin.example.com/@actor',
        object: 'https://origin.example.com/@object'
      }
    });
  });
});
