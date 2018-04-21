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

import { toUnicode } from 'punycode';
import AccessTokens from './access_tokens';
import Follows from './follows';
import LocalAccounts from './local_accounts';
import RemoteAccounts from './remote_accounts';
import Notes from './notes';
import Persons from './persons';
import RefreshTokens from './refresh_tokens';
import Subscribers from './subscribers';

export default function Repository({ console, host, origin, pg, redis }) {
  this.console = console;
  this.listeners = Object.create(null);
  this.host = toUnicode(host);
  this.origin = origin || 'https://' + host;
  this.pg = pg;
  this.redis = redis;

  redis.publisher.on('error', console.error);
  redis.subscriber.on('error', console.error);

  redis.subscriber.on('message', (channel, message) => {
    for (const listen of this.listeners[channel]) {
      listen(channel, message);
    }
  });
};

Object.assign(
  Repository.prototype,
  AccessTokens,
  Follows,
  LocalAccounts,
  RemoteAccounts,
  Notes,
  Persons,
  RefreshTokens,
  Subscribers);
