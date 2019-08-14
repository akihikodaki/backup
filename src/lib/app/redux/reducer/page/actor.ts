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

import { Dispatch } from 'redux';
import { Actor, Any } from '../../../../generated_activitystreams';
import { Reducible, ReducibleReference, Type } from '../../action';
import State, { OutboxItem, OutboxSection } from '../../state';

function pageActorOutboxLoad(
  state: NonNullable<State['page']['actor']>,
  actor: Actor,
  outboxActivityStreams: Any[],
  reference: Dispatch<ReducibleReference>
) {
  const dereferencedAnnounces = [];
  const dereferencedNotes = [];
  const referencedAnnounces = [];
  const referencedNotes = [];
  const outbox: OutboxSection[] = [];
  const lastSection: { publishedDate?: unknown, data: OutboxItem[] } =
    { data: [] };

  for (const { data } of state.outbox) {
    for (const item of data) {
      switch (item.type) {
      case 'Announce':
        dereferencedAnnounces.push({ acct: state.acct, object: item.object });
        break;

      case 'Note':
        dereferencedNotes.push(item.id);
        break;
      }
    }
  }

  for (const item of outboxActivityStreams) {
    if (item.type != 'Announce' && item.type != 'Note') {
      continue;
    }

    const publishedDate = item.published.substring(0, 10);

    if (publishedDate != lastSection.publishedDate) {
      lastSection.publishedDate = publishedDate;
      lastSection.data = [];
      outbox.push({ date: new Date(item.published), data: lastSection.data });
    }

    switch (item.type) {
    case 'Announce':
      referencedAnnounces.push({ acct: state.acct, actor, announce: item });
      lastSection.data.push({ type: 'Announce', object: item.object.id });
      break;

    case 'Note':
      referencedNotes.push(item);
      lastSection.data.push({ type: 'Note', id: item.id });
      break;
    }
  }

  reference({ type: Type.AnnouncesDereference, announces: dereferencedAnnounces });
  reference({ type: Type.AnnouncesReference, announces: referencedAnnounces });
  reference({ type: Type.NotesDereference, ids: dereferencedNotes });
  reference({ type: Type.NotesReference, activityStreams: referencedNotes });

  return { ...state, outbox };
}

export default function(
  state: State['page']['actor'],
  action: Reducible,
  reference: Dispatch<ReducibleReference>
) {
  switch (action.type) {
  case Type.PageActorAcctLoad:
    if (state) {
      reference({ type: Type.ActorsDereference, accts: [state.acct] });
    }
    return { acct: action.acct, notFound: false, outbox: [] };

  case Type.PageActorActorLoad:
    if (!state) {
      throw new Error;
    }

    if (action.actor) {
      reference({ type: Type.ActorsReference, actors: [action.actor] });
      return state;
    }

    return { ...state, notFound: true };

  case Type.PageActorOutboxLoad:
    if (!state) {
      throw new Error;
    }
    return pageActorOutboxLoad(state, action.actor, action.outbox, reference);

  default:
    return state;
  }
}
