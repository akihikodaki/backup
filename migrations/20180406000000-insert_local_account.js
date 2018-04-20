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

exports.up = (db, callback) => db.runSql(`CREATE FUNCTION insert_local_account(username TEXT, salt BYTEA, password BYTEA)
RETURNS INTEGER AS $$
  DECLARE person_id INTEGER;
  BEGIN
    INSERT INTO persons (username) VALUES ($1) RETURNING id INTO person_id;
    INSERT INTO local_accounts(salt, password) VALUES ($2, $3);
    RETURN person_id;
  END
$$ LANGUAGE plpgsql`, callback);
