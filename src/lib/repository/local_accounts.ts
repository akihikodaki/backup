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

import { Custom as CustomError } from '../errors';
import Actor from '../tuples/actor';
import LocalAccount from '../tuples/local_account';
import Status from '../tuples/status';
import Repository from '.';

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
  getInboxChannel(this: Repository, accountOrActor: LocalAccount | Actor) {
    if (accountOrActor.id) {
      return `${this.redis.prefix}inbox:${accountOrActor.id}:channel`;
    }

    throw new CustomError('Account or actor is not persisted.', 'error');
  }

  async insertLocalAccount(this: Repository, account: LocalAccount) {
    if (!(account.actor instanceof Actor)) {
      throw new CustomError('Invalid actor.', 'error');
    }

    const { rows: [ { insert_local_account } ] } = await this.pg.query({
      name: 'insertLocalAccount',
      text: 'SELECT insert_local_account($1, $2, $3, $4, $5, $6, $7, $8)',
      values: [
        account.actor.username,
        account.actor.name,
        account.actor.summary,
        account.admin,
        account.privateKeyDer,
        account.salt,
        account.serverKey,
        account.storedKey
      ]
    });

    account.id = insert_local_account;
    account.actor.id = insert_local_account;
  }

  async insertIntoInboxes(this: Repository, accountOrActors: (LocalAccount | Actor)[], item: Status) {
    const { id } = item;
    if (!id) {
      throw new CustomError('Unintialized status.', 'error');
    }

    const extension = await item.select('extension');
    if (!extension) {
      throw new CustomError('Extension not found.', 'error');
    }

    const message = await extension.toActivityStreams() as { [key: string]: unknown };
    message['@context'] = 'https://www.w3.org/ns/activitystreams';

    const string = JSON.stringify(message);

    return this.redis.client.pipeline(accountOrActors.map<string[]>(accountOrActor => [
      'zadd',
      `${this.redis.prefix}inbox:${accountOrActor.id}`,
      id,
      id
    ]).concat(accountOrActors.map(accountOrActor => [
      'zremrangebyrank',
      `${this.redis.prefix}inbox:${accountOrActor.id}`,
      '0',
      '-4096'
    ]), accountOrActors.map(accountOrActor => [
      'publish',
      this.getInboxChannel(accountOrActor),
      string
    ]))).exec();
  }

  async selectLocalAccountByDigestOfCookie(this: Repository, digest: Buffer): Promise<LocalAccount | null> {
    const { rows } = await this.pg.query({
      name: 'selectLocalAccountByDigestOfCookie',
      text: 'SELECT local_accounts.* FROM local_accounts JOIN cookies ON local_accounts.id = cookies.account_id WHERE cookies.digest = $1',
      values: [digest]
    });

    return rows[0] ? parse.call(this, rows[0]) : null;
  }

  async selectLocalAccountById(this: Repository, id: string): Promise<LocalAccount | null> {
    const { rows } = await this.pg.query({
      name: 'selectLocalAccountById',
      text: 'SELECT * FROM local_accounts WHERE id = $1',
      values: [id],
    });

    return rows[0] ? parse.call(this, rows[0]) : null;
  }
}