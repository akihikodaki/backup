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

export default {
  async insertNote(note) {
    const { rows } = await this.pg.query({
      name: 'insertNote',
      text: 'INSERT INTO notes (attributed_to_id, text) VALUES ($1, $2) RETURNING id',
      values: [note.attributedToId, note.text]
    });

    note.id = rows[0].id;
  },

  async selectRecentNotesByUsername(username) {
    const { rows } = await this.pg.query({
      name: 'selectRecentNotesByUsername',
      text: 'SELECT notes.* FROM notes JOIN users ON notes.attributed_to_id = users.id WHERE users.username = $1 ORDER BY notes.id DESC',
      values: [username]
    });

    return rows;
  }
};
