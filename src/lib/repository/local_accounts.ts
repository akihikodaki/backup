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
import {
  Announce as AnnounceActivityStreams,
  Note as NoteActivityStreams,
  StringifiableTo as ActivityStreamsStringifiableTo
} from '../generated_activitystreams';
import Actor from '../tuples/actor';
import LocalAccount, { Seed } from '../tuples/local_account';
import Status from '../tuples/status';
import Repository, { conflict } from '.';

function parse(this: Repository, { id, admin, private_key_der, salt, server_key, stored_key }: {
  readonly id: string;
  readonly admin: boolean;
  readonly private_key_der: Buffer;
  readonly salt: Buffer;
  readonly server_key: Buffer;
  readonly stored_key: Buffer;
}) {
  return new LocalAccount({
    repository: this,
    id,
    admin,
    privateKeyDer: private_key_der,
    salt,
    serverKey: server_key,
    storedKey: stored_key
  });
}

export default class {
  getInboxChannel(this: Repository, accountOrActor: LocalAccount | Actor, recover: (error: Error) => unknown) {
    if (accountOrActor.id) {
      return `${this.redis.prefix}inbox:${accountOrActor.id}:channel`;
    }

    throw recover(new Error('Unpersisted Account or Actor.'));
  }

  async insertLocalAccount(this: Repository, {
    actor,
    admin,
    privateKeyDer,
    salt,
    serverKey,
    storedKey
  }: Seed & {
    readonly privateKeyDer: Buffer;
  }, signal: AbortSignal, recover: (error: Error & {
    name?: string;
    [conflict]?: boolean;
  }) => unknown) {
    const result = await this.pg.query({
      name: 'insertLocalAccount',
      text: 'SELECT insert_local_account($1, $2, $3, $4, $5, $6, $7, $8)',
      values: [
        actor.username,
        actor.name,
        actor.summary,
        admin,
        privateKeyDer,
        salt,
        serverKey,
        storedKey
      ]
    }, signal, error => {
      if (error.name == 'AbortError') {
        return recover(error);
      }

      if (error.code == '22021') {
        return recover(error);
      }

      if (error.code == '23505') {
        return recover(Object.assign(
          new Error('username conflicts.'),
          { [conflict]: true }));
      }

      return error;
    });

    return new LocalAccount({
      repository: this,
      actor: new Actor({
        repository: this,
        id: result.rows[0].insert_local_account,
        username: actor.username,
        host: null,
        name: actor.name,
        summary: actor.summary
      }),
      admin,
      privateKeyDer,
      salt,
      serverKey,
      storedKey
    });
  }

  async insertIntoInboxes(
    this: Repository,
    actors: Actor[],
    item: Status,
    signal: AbortSignal,
    recover: (error: Error & { name?: string }) => unknown
  ) {
    const { id } = item;
    if (!id) {
      throw recover(new Error('Status uninitialized.'));
    }

    const extension = await item.select('extension', signal, recover);
    if (!extension) {
      throw recover(new Error('extension not found.'));
    }

    const messages = await Promise.all<
      ActivityStreamsStringifiableTo<
        AnnounceActivityStreams | NoteActivityStreams
      > & { '@context'?: string }
    >(actors.map(actor => extension.toActivityStreams(signal, recover, actor)));

    return this.redis.client.pipeline(actors.map<string[]>(actor => [
      'zadd',
      `${this.redis.prefix}inbox:${actor.id}`,
      id,
      id
    ]).concat(actors.map(actor => [
      'zremrangebyrank',
      `${this.redis.prefix}inbox:${actor.id}`,
      '0',
      '-4096'
    ]), messages.map((message, index) => {
      message['@context'] = 'https://www.w3.org/ns/activitystreams';

      return [
        'publish',
        this.getInboxChannel(actors[index]),
        JSON.stringify(message)
      ];
    }))).exec();
  }

  async selectLocalAccountByDigestOfCookie(
    this: Repository,
    digest: Buffer,
    signal: AbortSignal,
    recover: (error: Error & { name: string }) => unknown
  ): Promise<LocalAccount | null> {
    const { rows } = await this.pg.query({
      name: 'selectLocalAccountByDigestOfCookie',
      text: 'SELECT local_accounts.* FROM local_accounts JOIN cookies ON local_accounts.id = cookies.account_id WHERE cookies.digest = $1',
      values: [digest]
    }, signal, error => error.name == 'AbortError' ? recover(error) : error);

    return rows[0] ? parse.call(this, rows[0]) : null;
  }

  async selectLocalAccountById(
    this: Repository,
    id: string,
    signal: AbortSignal,
    recover: (error: Error & { name: string }) => unknown
  ): Promise<LocalAccount | null> {
    const { rows } = await this.pg.query({
      name: 'selectLocalAccountById',
      text: 'SELECT * FROM local_accounts WHERE id = $1',
      values: [id],
    }, signal, error => error.name == 'AbortError' ? recover(error) : error);

    return rows[0] ? parse.call(this, rows[0]) : null;
  }
}
