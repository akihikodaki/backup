/*
  Copyright (C) 2018  Miniverse authors

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

import Note from './note';
import Relation, { withRepository } from './relation';
import Status from './status';
import URI from './uri';

export default class Announce extends Relation {
  async toActivityStreams() {
    const note = await this.select('object');
    const status = await note.select('status');

    return { type: 'Announce', object: await status.getUri() };
  }

  static async create(repository, person, object, uri) {
    const announce = new this({
      repository,
      status: new Status({
        repository,
        person,
        uri: uri && new URI({ repository, uri })
      }),
      object
    });

    await repository.insertAnnounce(announce);

    return announce;
  }

  static async fromParsedActivityStreams(repository, object, actor) {
    const [objectId, objectObject, objectTo] = await Promise.all([
      object.getId(),
      object.getObject().then(async parsed =>
        Note.fromParsedActivityStreams(repository, parsed)),
      object.getTo()
            .then(elements => elements.map(element => element.getId()))
            .then(Promise.all.bind(Promise))
    ]);

    if (!objectTo.includes('https://www.w3.org/ns/activitystreams#Public')) {
      return null;
    }

    return this.create(repository, actor, objectObject, objectId);
  }
}

Announce.references =
  { object: { query: withRepository('selectNoteById'), id: 'objectId' } };