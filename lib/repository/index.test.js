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

import Repository from './index';

test('defaults finger host to host', () => {
  const repository = new Repository({ host: 'إختبار', redis: [] });

  try {
    expect(repository).toHaveProperty('fingerHost', 'إختبار');
  } finally {
    repository.redis.client.disconnect();
    repository.redis.subscriber.disconnect();
  }
});

test('allows to override finger host', () => {
  const repository = new Repository({ fingerHost: 'إختبار', redis: [] });

  try {
    expect(repository).toHaveProperty('fingerHost', 'إختبار');
  } finally {
    repository.redis.client.disconnect();
    repository.redis.subscriber.disconnect();
  }
});

test('sets host name to user agent', () => {
  const repository = new Repository({ host: 'إختبار', redis: [] });

  try {
    expect(repository).toHaveProperty('userAgent', 'Miniverse (xn--kgbechtv)');
  } finally {
    repository.redis.client.disconnect();
    repository.redis.subscriber.disconnect();
  }
});
