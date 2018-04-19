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

import { promisify } from 'util';
import Note from '../models/note';

export default {
  async insertNote(note) {
    const { rows } = await this.pg.query({
      name: 'insertNote',
      text: 'INSERT INTO notes (attributed_to_id, text) VALUES ($1, $2) RETURNING id',
      values: [note.attributedToId, note.text]
    });

    note.id = rows[0].id;
  },

  async selectRecentNotesByLowerUsername(lowerUsername) {
    const { rows } = await this.pg.query({
      name: 'selectRecentNotesByLowerUsername',
      text: 'SELECT notes.* FROM notes JOIN users ON notes.attributed_to_id = users.id WHERE lower(users.username) = $1 ORDER BY notes.id DESC',
      values: [lowerUsername]
    });

    return rows.map(row => new Note(row));
  },
 
  async selectRecentNotesFromInbox(user) {
    const { publisher } = this.redis;
    const promisifiedZrevrange = promisify(publisher.zrevrange.bind(publisher));
    const ids = await promisifiedZrevrange(`inbox:${user.id}`, 0, -1);
    const { rows } = await this.pg.query({
      name: 'selectRecentNotesFromInbox',
      text: 'SELECT notes.* FROM notes WHERE id = ANY(string_to_array($1, \',\')::integer[])',
      values: [ids.join()]
    });

    return ids.map(id => rows.find(row => row.id == id))
              .filter(Boolean)
              .map(row => new Note(row));
  }
};
