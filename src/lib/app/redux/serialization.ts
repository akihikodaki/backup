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

import OriginalState, { Note } from './state';

export interface State {
  actors: [
    string,
    {
      announces: [string, { readonly references: number }][];
      following?: boolean;
      name: string;
      outbox: string;
      preferredUsername: string;
      references: number;
    }
  ][];
  notes: [string, Note][];
  page: OriginalState['page'];
  session: OriginalState['session'];
}

export function serialize({
  actors,
  notes,
  page,
  session
}: OriginalState): State {
  return {
    actors: Array.from(actors, ([acct, actor]) => [
      acct,
      {
        ...actor,
        announces: Array.from(actor.announces.entries())
      }
    ]),
    notes: Array.from(notes.entries()),
    page,
    session
  };
}

export function deserialize({
  actors,
  notes,
  page,
  session
}: Readonly<State>): OriginalState {
  const deserialized = {
    actors: new Map,
    notes: new Map,
    page: page.actor ? {
      ...page,
      actor: {
        ...page.actor,
        outbox: page.actor.outbox.map(
          ({ date, data }) => ({ date: new Date(date), data }))
      }
    } : page,
    session
  };

  for (const [acct, actor] of actors) {
    deserialized.actors.set(
      acct, { ...actor, announces: new Map(actor.announces) });
  }

  for (const [id, note] of notes) {
    deserialized.notes.set(id, {
      ...note,
      published: new Date(note.published)
    });
  }

  return deserialized;
}
