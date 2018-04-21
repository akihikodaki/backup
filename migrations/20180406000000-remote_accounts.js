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

exports.up = (db, callback) => db.createTable('remote_accounts', {
  host: { type: 'string', notNull: true },
  person_id: {
    type: 'int',
    notNull: true,
    primaryKey: true,
    foreignKey: {
      name: 'person_id',
      table: 'persons',
      // local_accounts should not be deleted as it contains precious private
      // keys.
      rules: { onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      mapping: 'id',
    }
  },
}, callback);

exports._meta = { version: 1 };
