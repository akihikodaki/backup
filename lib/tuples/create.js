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

import { TypeNotAllowed } from '../parsed_activitystreams';
import Note from './note';
import Relation, { withRepository } from './relation';

export async function create(repository, attributedTo, object) {
  const [type] = await Promise.all([
    object.getType(),
    Promise.all([
      object.getAttributedTo()
          .then(actual => actual && actual.getId()),
      attributedTo.getUri()
    ]).then(([actual, expected]) => {
      if (actual && actual != expected) {
        throw new Error;
      }
    })
  ]);

  if (type.has('Note')) {
    return Note.fromParsedActivityStreams(repository, object, attributedTo);
  }

  throw new TypeNotAllowed;
}

export default class Create extends Relation {
  async toActivityStreams() {
    const object = await this.select('object');

    return {
      type: 'Create',
      object: await object.toActivityStreams()
    };
  }

  static async createFromParsedActivityStreams(repository, activity, actor) {
    const type = await activity.getType();
    if (!type.has('Create')) {
      throw new TypeNotAllowed;
    }

    return new this({
      repository,
      object: await create(repository, actor, await activity.getObject())
    });
  }
}

Create.references = {
  object: { query: withRepository('selectNoteById'), id: 'objectId' }
};