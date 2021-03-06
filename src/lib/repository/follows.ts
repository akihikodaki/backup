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
import Follow, { Seed } from '../tuples/follow';
import Repository from '.';

export default class {
  async deleteFollowByActorAndObject(
    this: Repository,
    actor: Actor,
    object: Actor,
    signal: AbortSignal,
    recover: (error: Error & { name: string }) => unknown
  ) {
    await this.pg.query({
      name: 'deleteFollow',
      text: 'DELETE FROM follows WHERE actor_id = $1 AND object_id = $2',
      values: [actor.id, object.id]
    }, signal, error => error.name == 'AbortError' ? recover(error) : error);
  }

  async insertFollow(
    this: Repository,
    { actor, object }: Seed,
    signal: AbortSignal,
    recover: (error: Error & { name?: string }) => unknown
  ) {
    const { rows: [{ id }] } = await this.pg.query({
      name: 'insertFollow',
      text: 'INSERT INTO follows (actor_id, object_id) VALUES ($1, $2) RETURNING id',
      values: [actor.id, object.id]
    }, signal, error => {
      if (error.name == 'AbortError') {
        return recover(error);
      }

      if (error.code == '23505') {
        return recover(new Error('Already followed.'));
      }

      return error;
    });

    return new Follow({ repository: this, id, actor, object });
  }

  async selectFollowByActorAndObject(
    this: Repository,
    actor: Actor,
    object: Actor,
    signal: AbortSignal,
    recover: (error: Error & { name: string }) => unknown
  ) {
    const { rows } = await this.pg.query({
      name: 'selectFollowByActorAndObject',
      text: 'SELECT id FROM follows WHERE actor_id = $1 AND object_id = $2',
      values: [actor.id, object.id]
    }, signal, error => error.name == 'AbortError' ? recover(error) : error);

    return rows[0] ? new Follow({
      repository: this,
      id: rows[0].id,
      actor,
      object
    }) : null;
  }

  async selectFollowIncludingActorAndObjectById(
    this: Repository,
    id: string,
    signal: AbortSignal,
    recover: (error: Error & { name: string }) => unknown
  ): Promise<Follow | null> {
    const { rows } = await this.pg.query({
      name: 'selectFollowIncludingActorAndObjectById',
      text: 'SELECT actors.id AS actor_id, actors.username AS actor_username, actors.host AS actor_host, actors.name AS actor_name, actors.summary AS actor_summary, objects.id AS object_id, objects.username AS object_username, objects.host AS object_host, objects.name AS object_name, objects.summary AS object_summary FROM follows JOIN actors ON actors.id = follows.actor_id JOIN actors AS objects ON objects.id = follows.object_id WHERE follows.id = $1',
      values: [id]
    }, signal, error => error.name == 'AbortError' ? recover(error) : error);

    return rows[0] ? new Follow({
      repository: this,
      id,
      actor: new Actor({
        repository: this,
        id: rows[0].actor_id,
        username: rows[0].actor_username,
        host: rows[0].actor_host || null,
        name: rows[0].actor_name,
        summary: rows[0].actor_summary
      }),
      object: new Actor({
        repository: this,
        id: rows[0].object_id,
        username: rows[0].object_username,
        host: rows[0].object_host || null,
        name: rows[0].object_name,
        summary: rows[0].object_summary
      })
    }) : null;
  }
}
