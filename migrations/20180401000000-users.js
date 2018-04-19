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

exports.up = (db, callback) => db.createTable('users', {
  id: { type: 'int', autoIncrement: true, notNull: true, primaryKey: true },
  salt: { type: 'bytea', notNull: true },
  username: { type: 'string', notNull: true },
  password: { type: 'bytea', notNull: true },
}, error => {
  if (error) {
    callback(error);
  } else {
    db.runSql('CREATE UNIQUE INDEX users_username ON users ((lower(username)))', callback);
  }
});

exports._meta = { version: 1 };
