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
import Repository from '.';

function parse(this: Repository, { id, username, host, name, summary }: {
  readonly id: string;
  readonly username: string;
  readonly host: null | string;
  readonly name: string;
  readonly summary: string;
}) {
  return new Actor({
    repository: this,
    id,
    username,
    host: host || null,
    name,
    summary
  });
}

export default class {
  async selectActorById(
    this: Repository,
    id: string,
    signal: AbortSignal,
    recover: (error: Error & { name: string }) => unknown
  ): Promise<Actor | null> {
    const { rows } = await this.pg.query({
      name: 'selectActorById',
      text: 'SELECT * FROM actors WHERE id = $1',
      values: [id]
    }, signal, error => error.name == 'AbortError' ? recover(error) : error);

    return rows[0] ? parse.call(this, rows[0]) : null;
  }

  async selectActorByUsernameAndNormalizedHost(
    this: Repository,
    username: string,
    normalizedHost: string,
    signal: AbortSignal,
    recover: (error: Error & { name: string }) => unknown
  ): Promise<Actor | null> {
    const { rows } = await this.pg.query({
      name: 'selectActorByUsernameAndNormalizedHost',
      text: 'SELECT * FROM actors WHERE username = $1 AND lower(host) = $2',
      values: [username, normalizedHost || '']
    }, signal, error => error.name == 'AbortError' ? recover(error) : error);

    return rows[0] ? parse.call(this, rows[0]) : null;
  }

  async selectActorsByFolloweeId(
    this: Repository,
    id: string,
    signal: AbortSignal,
    recover: (error: Error & { name: string }) => unknown
  ) {
    const { rows } = await this.pg.query({
      name: 'selectActorsByFollowee',
      text: 'SELECT actors.* FROM actors JOIN follows ON actors.id = follows.actor_id WHERE follows.object_id = $1',
      values: [id]
    }, signal, error => error.name == 'AbortError' ? recover(error) : error);

    return (rows as any[]).map(parse, this);
  }

  async selectActorsMentionedByNoteId(
    this: Repository,
    id: string,
    signal: AbortSignal,
    recover: (error: Error & { name: string }) => unknown
  ) {
    const { rows } = await this.pg.query({
      name: 'selectActorsMentionedByNoteId',
      text: 'SELECT actors.* FROM actors JOIN mentions ON actors.id = mentions.href_id WHERE mentions.note_id = $1',
      values: [id]
    }, signal, error => error.name == 'AbortError' ? recover(error) : error);

    return (rows as any[]).map(parse, this);
  }
}
