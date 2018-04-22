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

import Bull from 'bull';
import { toUnicode } from 'punycode';
import AccessTokens from './access_tokens';
import Follows from './follows';
import LocalAccounts from './local_accounts';
import RemoteAccounts from './remote_accounts';
import Notes from './notes';
import Persons from './persons';
import RefreshTokens from './refresh_tokens';
import Subscribers from './subscribers';
const Redis = require('ioredis');

export default function Repository({ console, host, origin, pg, redis }) {
  this.console = console;
  this.listeners = Object.create(null);
  this.host = toUnicode(host);
  this.origin = origin || 'https://' + host;
  this.pg = pg;

  this.redis = {
    url: redis,
    client: new Redis(redis),
    subscriber: new Redis(redis)
  };

  this.queue = new Bull('HTTP', {
    createClient: (function(type) {
      switch (type) {
      case 'client':
        return this.client;

      case 'subscriber':
        return this.subscriber;

      default:
        return new Redis(redis);
      }
    }).bind(this.redis)
  });

  this.redis.subscriber.on('message', (channel, message) => {
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
