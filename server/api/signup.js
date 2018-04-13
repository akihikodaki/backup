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

const express = require('express');
const User = require('../entities/user');

module.exports = ({ users }) => {
  const application = express();

  application.post('/v0/signup', express.urlencoded({ extended: false }), ({ body }, response) => {
    User.create(body.username, body.password).then(users.insert).then(() => {
      response.status(202).end();
    }, error => {
      console.error(error);
      response.sendStatus(500);
    });
  });

  return application;
};