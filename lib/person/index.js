/*
  Copyright (C) 2018  Akihiko Odaki <nekomanma@pixiv.co.jp>

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

import { URL } from 'url';
import ActivityStreams from '../activitystreams';
import Key from '../key';
import RemoteAccount from '../remote_account';
import URI from '../uri';
import Resolver from './resolver';

export default class Person {
  constructor(properties) {
    Object.assign(this, properties);

    if (this.account) {
      this.account.person = this;
    }
  }

  validate() {
    if (this.username.includes('@')) {
      throw new Error;
    }
  }

  async getUri(repository) {
    if (this.host) {
      const { uri } = await repository.selectRemoteAccountByPerson(this);
      return uri;
    }

    return `${repository.origin}/@${URI.encodeSegment(this.username)}`;
  }

  async toActivityStreams(repository) {
    if (this.host) {
      const acct = URI.encodeSegment(`${this.username}@${this.host}`);
      const id = `${repository.origin}/@${acct}`;

      return new ActivityStreams({
        id,
        type: 'Person',
        preferredUsername: this.username,
        inbox: id + '/inbox',
        outbox: id + '/outbox'
      });
    }

    const [id, publicKey, { salt }] = await Promise.all([
      this.getUri(repository),
      (new Key({ owner: this })).toActivityStreams(repository),
      repository.selectLocalAccountByPerson(this)
    ]);

    return new ActivityStreams({
      id,
      type: 'Person',
      preferredUsername: this.username,
      inbox: id + '/inbox',
      outbox: id + '/outbox',
      publicKey,
      'activeNode:salt': salt.toString('base64')
    });
  }

  static async fromActivityStreams(repository, host, object) {
    const id = object.getId();
    const idUrl = new URL(id);
    const [inbox, username, publicKey] = await Promise.all([
      object.getInbox(),
      object.getPreferredUsername(),
      object.getPublicKey()
    ]);
    const publicKeyId = publicKey.getId();
    const publicKeyIdUrl = new URL(publicKeyId);

    if (idUrl.host.toLowerCase() != publicKeyIdUrl.host.toLowerCase()) {
      throw new Error;
    }

    const person = new this({
      account: new RemoteAccount({
        uri: id,
        inbox: { uri: inbox.getId() },
        publicKey: {
          uri: publicKeyId,
          publicKeyPem: await publicKey.getPublicKeyPem()
        }
      }),
      username,
      host
    });

    person.validate();
    await repository.insertRemoteAccount(person.account);

    return person;
  }
}

Object.assign(Person, Resolver);
