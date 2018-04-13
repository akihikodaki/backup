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

const constructPg = require('./constructors/pg');
const constructRedis = require('./constructors/redis');
const AccessTokens = require('./access_tokens');
const Feed = require('./feed');
const Notes = require('./notes');
const RefreshTokens = require('./refresh_tokens');
const Users = require('./users');

module.exports = function(redis) {
  constructPg.call(this);
  constructRedis.call(this, redis);
};

Object.assign(
  module.exports.prototype,
  AccessTokens,
  Feed,
  Notes,
  RefreshTokens,
  Users);
