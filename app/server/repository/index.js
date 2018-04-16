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

import constructPg from './constructors/pg';
import constructRedis from './constructors/redis';
import AccessTokens from './access_tokens';
import Feeds from './feeds';
import Follows from './follows';
import Notes from './notes';
import RefreshTokens from './refresh_tokens';
import Users from './users';

export default function Repository(redis) {
  constructPg.call(this);
  constructRedis.call(this, redis);
};

Object.assign(
  Repository.prototype,
  AccessTokens,
  Feeds,
  Follows,
  Notes,
  RefreshTokens,
  Users);
