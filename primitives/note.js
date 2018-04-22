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

export default class {
  constructor({ id, attributedTo, attributedToId, text }) {
    this.id = id;
    this.attributedTo = attributedTo;
    this.attributedToId = attributedTo.id || attributedToId;
    this.text = text;
  }

  async toActivityStreams() {
    return { type: 'Note', text: this.text };
  }

  static async create(repository, attributedTo, text) {
    const note = this({ attributedTo, text });
    await repository.insertNote(note);
    return note;
  }

  static fromActivityStreams(repository, attributedTo, { text }) {
    return this.create(repository, attributedTo, text);
  }
};
