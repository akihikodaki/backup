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

import { AbortSignal } from 'abort-controller';
import Actor from '../tuples/actor';
import Announce from '../tuples/announce';
import Note from '../tuples/note';
import Status from '../tuples/status';
import URI from '../tuples/uri';
import Repository from '.';

const invalidRepresentation = {};

function parseExtension(this: Repository, {
  id,
  announce_object_id,
  note_in_reply_to_id,
  note_likes,
  note_summary,
  note_content
}: {
  id: string;
  announce_object_id: null | string;
  note_in_reply_to_id: null | string;
  note_likes: number;
  note_summary: string;
  note_content: string;
}) {
  return announce_object_id ? new Announce({
    repository: this,
    id,
    object: new Note({
      repository: this,
      id: announce_object_id,
      inReplyToId: note_in_reply_to_id,
      likes: note_likes,
      summary: note_summary || null,
      content: note_content
    })
  }) : new Note({
    repository: this,
    id,
    inReplyToId: note_in_reply_to_id,
    likes: note_likes,
    summary: note_summary || null,
    content: note_content
  });
}

export default class {
  async deleteStatusByUriAndAttributedTo(
    this: Repository,
    uri: URI,
    attributedTo: Actor,
    signal: AbortSignal,
    recover: (error: Error & { name: string }) => unknown
  ) {
    await this.pg.query({
      name: 'deleteStatusByUriAndAttributedTo',
      text: 'SELECT delete_status($1, $2)',
      values: [uri.id, attributedTo.id]
    }, signal, error => error.name == 'AbortError' ? recover(error) : error);
  }

  async selectRecentStatusesIncludingExtensionsByActorId(
    this: Repository,
    actorId: string,
    signal: AbortSignal,
    recover: (error: Error & { name: string }) => unknown
  ): Promise<Status[]> {
    try {
      const { rows } = await this.pg.query({
        name: 'selectRecentStatusesIncludingExtensionsByActorId',
        text: 'SELECT statuses.*, announces.object_id AS announce_object_id, notes.in_reply_to_id AS note_in_reply_to_id, notes.likes AS note_likes, notes.summary AS note_summary, notes.content AS note_content FROM statuses LEFT OUTER JOIN announces USING (id) JOIN notes ON COALESCE(announces.object_id, statuses.id) = notes.id WHERE statuses.actor_id = $1 ORDER BY statuses.id DESC',
        values: [actorId]
      }, signal, error => {
        if (error.code == '22P02') {
          return invalidRepresentation;
        }

        if (error.name == 'AbortError') {
          return recover(error);
        }

        return error;
      });

      return (rows as any[]).map(row => new Status({
        repository: this,
        id: row.id,
        published: row.published,
        actorId,
        extension: parseExtension.call(this, row)
      }));
    } catch (error) {
      if (error == invalidRepresentation) {
        return [];
      }

      throw error;
    }
  }

  async selectRecentStatusesIncludingExtensionsAndActorsFromInbox(
    this: Repository,
    actorId: string,
    signal: AbortSignal,
    recover: (error: Error & { name?: string }) => unknown
  ): Promise<Status[]> {
    const ids = await this.redis.client.zrevrange(
      `${this.redis.prefix}inbox:${actorId}`, 0, -1);

    const { rows } = await this.pg.query({
      name: 'selectRecentStatusesIncludingExtensionsAndActorsFromInbox',
      text: 'SELECT statuses.*, announces.object_id AS announce_object_id, notes.in_reply_to_id AS note_in_reply_to_id, notes.likes AS note_likes, notes.summary AS note_summary, notes.content AS note_content, actors.username AS actor_username, actors.host AS actor_host, actors.name AS actor_name, actors.summary AS actor_summary FROM statuses LEFT OUTER JOIN announces USING (id) JOIN notes ON COALESCE(announces.object_id, statuses.id) = notes.id JOIN actors ON statuses.actor_id = actors.id WHERE statuses.id = ANY($1)',
      values: [ids]
    }, signal, error => error.name == 'AbortError' ? recover(error) : error);

    return (ids as string[])
      .map(id => (rows as any[]).find(row => row.id == id)).filter(Boolean).map(row => new Status({
        repository: this,
        id: row.id,
        published: row.published,
        actor: new Actor({
          repository: this,
          id: row.actor_id,
          username: row.actor_username,
          host: row.actor_host || null,
          name: row.actor_name,
          summary: row.actor_summary
        }),
        extension: parseExtension.call(this, row)
      }));
  }

  async selectStatusById(
    this: Repository,
    id: string,
    signal: AbortSignal,
    recover: (error: Error & { name: string }) => unknown
  ): Promise<Status | null> {
    try {
      const { rows } = await this.pg.query({
        name: 'selectStatusById',
        text: 'SELECT actor_id FROM statuses WHERE id = $1',
        values: [id]
      }, signal, error => {
        if (error.code == '22P02') {
          return invalidRepresentation;
        }

        if (error.name == 'AbortError') {
          return recover(error);
        }

        return error;
      });

      return rows[0] ? new Status({
        repository: this,
        id,
        published: rows[0].published,
        actorId: rows[0].actor_id
      }) : null;
    } catch (error) {
      if (error == invalidRepresentation) {
        return null;
      }

      throw error;
    }
  }

  async selectStatusIncludingExtensionById(
    this: Repository,
    id: string,
    signal: AbortSignal,
    recover: (error: Error & { name: string }) => unknown
  ): Promise<Status | null> {
    try {
      const { rows } = await this.pg.query({
        name: 'selectStatusIncludingExtensionById',
        text: 'SELECT statuses.*, announces.object_id AS announce_object_id, notes.in_reply_to_id AS note_in_reply_to_id, notes.likes AS note_likes, notes.summary AS note_summary, notes.content AS note_content FROM statuses LEFT OUTER JOIN announces USING (id) JOIN notes ON COALESCE(announces.object_id, statuses.id) = notes.id WHERE statuses.id = $1',
        values: [id]
      }, signal, error => {
        if (error.code == '22P02') {
          return invalidRepresentation;
        }

        if (error.name == 'AbortError') {
          return recover(error);
        }
      
        return error;
      });

      return rows[0] ? new Status({
        repository: this,
        id,
        published: rows[0].published,
        actorId: rows[0].actor_id,
        extension: parseExtension.call(this, rows[0])
      }) : null;
    } catch (error) {
      if (error == invalidRepresentation) {
        return null;
      }

      throw error;
    }
  }
}
