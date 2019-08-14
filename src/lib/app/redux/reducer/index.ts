/*
  Copyright (C) 2019  Miniverse authors

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

import { Reducible, ReducibleReference } from '../action';
import State from '../state';
import actors from './actors';
import notes from './notes';
import pageActor from './page/actor';
import pageNote from './page/note';
import session from './session';

export default function reducer(state?: State, action?: Reducible) {
  if (!state) {
    throw new Error;
  }

  let reducableReferences: ReducibleReference[] = [];
  let reduced = state;

  function pushReducableReference<T extends ReducibleReference>(reference: T) {
    reducableReferences.push(reference);
    return reference;
  }

  while (action) {
    reduced = {
      actors: actors(reduced.actors, action, pushReducableReference),
      notes: notes(reduced.notes, action, pushReducableReference),
      page: {
        actor: pageActor(reduced.page.actor, action, pushReducableReference),
        note: pageNote(reduced.page.note, action, pushReducableReference)
      },
      session: session(reduced.session, action, pushReducableReference)
    };

    action = reducableReferences.pop();
  }

  return reduced;
}
