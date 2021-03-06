/*
  Copyright (C) 2018  Miniverse authors

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

import { AbortController } from 'abort-controller';
import { createPrivateKey } from 'crypto';
import { fabricateLocalAccount } from '../test/fabricator';
import repository from '../test/repository';
import LocalAccount from './local_account';

const { signal } = new AbortController;

describe('toWebFinger', () => {
  test('returns WebFinger representation', async () => {
    const recover = jest.fn();
    const account = await fabricateLocalAccount({
      actor: {
        // See if it correctly encodes username.
        username: 'name of user'
      }
    });

    await expect(account.toWebFinger(signal, recover)).resolves.toEqual({
      links: [
        {
          href: 'https://xn--kgbechtv/@name%20of%20user',
          rel: 'self',
          type: 'application/activity+json'
        }
      ],
      subject: 'acct:name%20of%20user@finger.xn--kgbechtv'
    });

    expect(recover).not.toHaveBeenCalled();
  });
});

describe('create', () => {
  test('creates and returns an account', async () => {
    const username = 'name of user';
    const name = '';
    const summary = '<script>alert("XSS")</script>';
    const admin = true;
    const salt = Buffer.from('salt');
    const serverKey = Buffer.from('serverKey');
    const storedKey = Buffer.from('storedKey');
    const recover = jest.fn();

    const account = await LocalAccount.create(repository, {
      actor: {
        username,
        name,
        summary
      },
      admin,
      salt,
      serverKey,
      storedKey
    }, signal, recover);

    const privateKey = createPrivateKey({
      format: 'der',
      type: 'pkcs1',
      key: account.privateKeyDer
    });

    expect(recover).not.toHaveBeenCalled();
    expect(account).toHaveProperty('repository', repository);
    expect(account).toHaveProperty(['actor', 'repository'], repository);
    expect(account).toHaveProperty(['actor', 'username'], username);
    expect(account).toHaveProperty(['actor', 'host'], null);
    expect(account).toHaveProperty(['actor', 'name'], '');
    expect(account).toHaveProperty(['actor', 'summary'], '');
    expect(account).toHaveProperty('admin', admin);
    expect(account).toHaveProperty('salt', salt);
    expect(account).toHaveProperty('serverKey', serverKey);
    expect(account).toHaveProperty('storedKey', storedKey);

    expect(privateKey).toHaveProperty('asymmetricKeyType', 'rsa');
    expect(privateKey).toHaveProperty('type', 'private');
  });

  test('will rejects with an error if username is invalid', async () => {
    const recovery = {};

    await expect(LocalAccount.create(repository, {
      actor: {
        username: '@',
        name: '',
        summary: ''
      },
      admin: true,
      salt: Buffer.from('salt'),
      serverKey: Buffer.from('serverKey'),
      storedKey: Buffer.from('storedKey'),
    }, signal, () => recovery)).rejects.toBe(recovery);
  });
});
