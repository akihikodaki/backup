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
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const express = require('express');
const createApi = require('./api');
const createOauth = require('./oauth');
const Repositories = require('./repositories');
const createUser = require('./user');

module.exports = redis => {
  const application = express();
  const repositories = new Repositories(redis);

  application.use('/api', createApi(repositories));
  application.use('/oauth', createOauth(repositories));
  application.use(createUser());
  application.use(express.static('dist'));

  return application;
};
