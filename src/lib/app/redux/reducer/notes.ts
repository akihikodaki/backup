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

import { fromString } from 'html-to-text';
import { Dispatch } from 'redux';
import { Note, generateAcct } from '../../../generated_activitystreams';
import { Reducible, ReducibleReference, Type } from '../action';
import State from '../state';

function dereferenceNotes(
  state: State['notes'],
  ids: Iterable<string>,
  reference: Dispatch<ReducibleReference>
) {
  const accts = [];
  const reduced = new Map(state);

  for (const id of ids) {
    const note = reduced.get(id);
    if (!note) {
      throw new Error;
    }

    if (note.references > 1) {
      reduced.set(id, { ...note, references: note.references - 1 });
    } else {
      accts.push(note.attributedTo);
      reduced.delete(id);
    }
  }

  reference({ type: Type.ActorsDereference, accts });

  return reduced;
}

function referenceNotes(
  state: State['notes'],
  activityStreams: Iterable<Note>,
  reference: Dispatch<ReducibleReference>
) {
  const actors = [];
  const reduced = new Map(state);

  for (const item of activityStreams) {
    const oldNote = reduced.get(item.id);
    const acctAttributedTo = generateAcct(item.attributedTo);
    let references = 1;

    if (oldNote) {
      references += oldNote.references;
    } else {
      actors.push(item.attributedTo);
    }

    reduced.set(item.id, {
      attributedTo: acctAttributedTo,
      content: fromString(item.content),
      likes: item['miniverse:reaction'].totalItems,
      published: new Date(item.published),
      references
    });
  }

  reference({ type: Type.ActorsReference, actors });

  return reduced;
}

export default function(
  state: State['notes'],
  action: Reducible,
  reference: Dispatch<ReducibleReference>
) {
  switch (action.type) {
  case Type.NotesDereference:
    return dereferenceNotes(state, action.ids, reference);
  case Type.NotesReference:
    return referenceNotes(state, action.activityStreams, reference);
  default:
    return state;
  }
}
