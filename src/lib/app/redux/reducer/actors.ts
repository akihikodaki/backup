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
import {
  Actor,
  Announce,
  generateAcct
} from '../../../generated_activitystreams';
import { Reducible, Type, ReducibleReference } from '../action';
import State from '../state';

function dereferenceActors(state: State['actors'], accts: Iterable<string>) {
  const reduced = new Map(state);

  for (const acct of accts) {
    const actor = reduced.get(acct);
    if (!actor) {
      throw new Error;
    }

    const { announces, references } = actor;

    if (references > 1 || announces.size > 0) {
      reduced.set(acct, { ...actor, references: references - 1 });
    } else {
      reduced.delete(acct);
    }
  }

  return reduced;
}

function dereferenceAnnounces(
  state: State['actors'],
  announces: Iterable<{ acct: string; object: string }>,
  reference: Dispatch<ReducibleReference>
) {
  const reduced = new Map(state);
  const newActors = new Map;
  const dereferencedNotes = [];

  for (const { acct, object } of announces) {
    let newActor = newActors.get(acct);

    if (!newActor) {
      const actor = reduced.get(acct);
      if (!actor) {
        throw new Error;
      }

      newActor = {
        ...actor,
        announces: new Map(actor.announces)
      };

      newActors.set(acct, newActor);
    }

    const announce = newActor.announces.get(object);
    if (announce.references > 1) {
      newActor.announces.set(object, {
        ...announce,
        reference: announce.references - 1
      });
    } else if (newActor.references > 0 && newActor.announces.length > 1) {
      newActor.announces.delete(object);
      dereferencedNotes.push(object);
    } else {
      newActors.delete(acct);
      reduced.delete(acct);
      dereferencedNotes.push(object);
    }
  }

  reference({ type: Type.NotesDereference, ids: dereferencedNotes });

  for (const [acct, actor] of newActors) {
    reduced.set(acct, actor);
  }

  return reduced;
}

function referenceActors(
  state: State['actors'],
  actors: Iterable<Actor>
) {
  const reduced = new Map(state);

  for (const actor of actors) {
    const acct = generateAcct(actor);
    const oldActor = reduced.get(acct);

    reduced.set(acct, {
      announces: oldActor ? oldActor.announces : new Map,
      following: actor['miniverse:following'],
      name: actor.name,
      outbox: actor.outbox,
      preferredUsername: actor.preferredUsername,
      references: oldActor ? oldActor.references + 1 : 1
    });
  }

  return reduced;
}

function referenceAnnounces(
  state: State['actors'],
  announces: Iterable<{ actor: Actor; announce: Announce }>,
  reference: Dispatch<ReducibleReference>
) {
  const newActors = new Map;
  const referencedNotes = [];

  for (const { actor, announce } of announces) {
    const acct = generateAcct(actor);
    const newActor = newActors.get(acct);

    if (newActor) {
      const newAnnounce = newActor.announces[announce.object.id];
      if (newAnnounce) {
        newAnnounce.references++;
      } else {
        newActor.announces[announce.object.id] = { references: 1 };
        referencedNotes.push(announce.object);
      }
    } else {
      const oldActor = state.get(acct);
      const value = {
        announces: new Map([[announce.object.id, { references: 1 }]]),
        following: actor['miniverse:following'],
        name: actor.name,
        outbox: actor.outbox,
        preferredUsername: actor.preferredUsername
      };

      newActors.set(acct, oldActor ?
          { ...oldActor, value } : { references: 0, value });

      referencedNotes.push(announce.object);
    }
  }

  reference({ type: Type.NotesReference, activityStreams: referencedNotes });

  const reduced = new Map(state);

  for (const [acct, actor] of newActors) {
    reduced.set(acct, actor);
  }

  return reduced;
}

export default function(state: State['actors'], action: Reducible, reference: Dispatch<ReducibleReference>) {
  switch (action.type) {
  case Type.ActorsDereference:
    return dereferenceActors(state, action.accts);
  case Type.ActorsReference:
    return referenceActors(state, action.actors);
  case Type.AnnouncesDereference:
    return dereferenceAnnounces(state, action.announces, reference);
  case Type.AnnouncesReference:
    return referenceAnnounces(state, action.announces, reference);
  default:
    return state;
  }
}
