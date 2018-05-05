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

import Note from '../note';
import Person from '../person';

function parse({ id, attributed_to_id, content }) {
  const note = new Note({
    id,
    attributedTo: new Person({ id: attributed_to_id }),
    content
  });

  this.loadeds.add(note);
  return note;
}

export default {
  async insertNote(note) {
    const { rows } = await this.pg.query({
      name: 'insertNote',
      text: 'INSERT INTO notes (attributed_to_id, content) VALUES ($1, $2) RETURNING id',
      values: [note.attributedTo.id, note.content]
    });

    note.id = rows[0].id;
    this.loadeds.add(note);
  },

  async selectRecentNotesByUsernameAndNormalizedHost(username, normalizedHost) {
    const { rows } =  await this.pg.query({
      name: 'selectRecentNotesByUsernameAndNormalizedHost',
      text: 'SELECT notes.* FROM notes JOIN persons ON notes.attributed_to_id = persons.id WHERE persons.username = $1 AND lower(persons.host) = $2 ORDER BY notes.id DESC',
      values: [username, normalizedHost || '']
    });

    return rows.map(parse.bind(this));
  },
 
  async selectRecentNotesFromInbox({ person }) {
    const ids = await this.redis.client.zrevrange(`inbox:${person.id}`, 0, -1);
    const { rows } = await this.pg.query({
      name: 'selectRecentNotesFromInbox',
      text: 'SELECT notes.* FROM notes WHERE id = ANY(string_to_array($1, \',\')::integer[])',
      values: [ids.join()]
    });

    return ids.map(id => rows.find(row => row.id == id))
              .filter(Boolean)
              .map(parse.bind(this));
  }
};
