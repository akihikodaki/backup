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

import {
  signIn as signInBody,
  signUp as signUpBody
} from 'isomorphism/identity';
import {
  Actor,
  Announce,
  Any,
  LocalActor,
  Note
} from '../../../generated_activitystreams';
import { MiddlewareAPI, Plain } from '../types';
import { fetchActor, fetchOutbox, fetchStatus } from './fetch';

export enum Type {
  ActorsDereference,
  ActorsReference,
  AnnouncesDereference,
  AnnouncesReference,
  NotesDereference,
  NotesReference,
  PageActorAcctLoad,
  PageActorActorLoad,
  PageActorOutboxLoad,
  PageNoteIdLoad,
  PageNoteNoteLoad,
  SignIn
}

export type Reducible =
  ReducibleReference |
  { type: Type.PageActorAcctLoad; acct: string } |
  { type: Type.PageActorActorLoad; actor: Actor | null } |
  { type: Type.PageActorOutboxLoad; actor: Actor; outbox: Any[] } |
  { type: Type.PageNoteIdLoad; params: { acct: string; id: string }; id: string } |
  { type: Type.PageNoteNoteLoad; note: Note | null } |
  { type: Type.SignIn; activityStreams: Actor };

export type ReducibleReference =
  { type: Type.ActorsDereference; accts: Iterable<string> } |
  { type: Type.ActorsReference; actors: Iterable<Actor> } |
  { type: Type.AnnouncesDereference; announces: Iterable<{ acct: string; object: string }> } |
  { type: Type.AnnouncesReference; announces: Iterable<{ actor: Actor; announce: Announce }> } |
  { type: Type.NotesDereference, ids: Iterable<string> } |
  { type: Type.NotesReference, activityStreams: Iterable<Note> };

export function loadPageActor(acctLike: string) {
  return async ({ dispatch, getState }: MiddlewareAPI, plain: Plain) => {
    const acct = acctLike.includes('@') ?
      acctLike :
      `${acctLike}@${getState().session.fingerHost}`;

    function shouldAbort() {
      const { actor } = getState().page;
      return !actor || actor.acct != acct;
    }

    dispatch({ type: Type.PageActorAcctLoad, acct });

    const actor = await fetchActor(getState(), plain, acct);
    if (shouldAbort()) {
      return;
    }

    dispatch({ type: Type.PageActorActorLoad, actor });

    if (actor) {
      const outbox = await fetchOutbox(actor, plain);

      if (!shouldAbort() && outbox) {
        dispatch({
          type: Type.PageActorOutboxLoad,
          actor,
          outbox: outbox.orderedItems
        });
      }
    }
  };
}

export function loadPageNote(paramAcct: string, paramId: string) {
  return async ({ dispatch, getState }: MiddlewareAPI, plain: Plain) => {
    const id = `https://${getState().session.host}/@${paramAcct}/${paramId}`;

    dispatch({
      type: Type.PageNoteIdLoad,
      params: { acct: paramAcct, id: paramId },
      id
    });

    const status = await fetchStatus(plain, id);
    const { note } = getState().page;
    if (!note || note.id != id) {
      return;
    }

    dispatch({
      type: Type.PageNoteNoteLoad,
      note: status && status.type == 'Note' ? status : null
    });
  };
}

export function send(content: string) {
  return ({ getState }: MiddlewareAPI, { postJSON }: Plain) => {
    const { actors, session } = getState();
    if (!session.user) {
      throw new Error;
    }

    const actor = actors.get(session.user);
    if (!actor) {
      throw new Error;
    }

    return postJSON({ 'Content-Type': 'application/activity+json' }, actor.outbox, {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Note',
      published: new Date,
      to: 'https://www.w3.org/ns/activitystreams#Public',

      // HTML Standard
      // 12.1.2 Elements
      // https://html.spec.whatwg.org/multipage/syntax.html#element-restrictions
      // > Normal elements can have text, character references, other
      // > elements, and comments, but the text must not contain the character
      // > U+003C LESS-THAN SIGN (<) or an ambiguous ampersand. Some normal
      // > elements also have yet more restrictions on what content they are
      // > allowed to hold, beyond the restrictions imposed by the content
      // > model and those described in this paragraph. Those restrictions
      // > are described below.
      content: `<p>${content.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`,

      attachment: [],
      tag: []
    });
  };
}

export function signUpOrSignIn(username: string, password: string) {
  return async ({ dispatch, getState }: MiddlewareAPI, plain: Plain) => {
    const acct = `${username}@${getState().session.host}`;
    let activityStreams = await fetchActor(getState(), plain, acct);
    if (activityStreams) {
      await signInBody(activityStreams as LocalActor, password, getState().session.nonce);
    } else {
      await signUpBody(username, password);
      activityStreams = await fetchActor(getState(), plain, acct) as LocalActor;
    }

    dispatch({ type: Type.SignIn, activityStreams });
  };
}
