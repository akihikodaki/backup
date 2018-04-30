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

import { get } from 'http';
import { URL, domainToUnicode } from 'url';
import { promisify } from 'util';
import ActivityStreams from './activitystreams';
import LocalAccount from './local_account';
import RemoteAccount from './remote_account';
import URI from './uri';
const WebFinger = require('webfinger.js');
const { extractPublic } = __non_webpack_require__('../key/build/Release/key');

const webFinger = new WebFinger({ tls_only: false });
const lookup = promisify(webFinger.lookup.bind(webFinger));

async function getActivityStreams(href) {
  const { protocol, hostname, port, pathname, search } = new URL(href);
  let json = '';

  await new Promise((resolve, reject) => get({
    protocol,
    hostname,
    port,
    path: pathname + search,
    headers: { Accept: 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"' }
  }, response => {
    response.on('data', chunk => json += chunk);
    response.on('end', resolve);
  }).on('error', reject));

  const object = new ActivityStreams(JSON.parse(json));

  object.validateContext();

  if (object.type != 'Person') {
    throw new Error;
  }

  return object;
}

export default class {
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

    const { privateKeyPem, salt } =
      await repository.selectLocalAccountByPerson(this);

    const id = await this.getUri(repository);

    return new ActivityStreams({
      id,
      type: 'Person',
      preferredUsername: this.username,
      inbox: id + '/inbox',
      outbox: id + '/outbox',
      publicKey: {
        type: 'Key',
        publicKeyPem: extractPublic(privateKeyPem)
      },
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

  static async resolveByAcct(repository, acct) {
    const [encodedUserpart, encodedHost] = acct.toLowerCase().split('@', 2);
    const userpart = decodeURI(encodedUserpart);

    if (encodedHost) {
      const host = encodedHost && domainToUnicode(encodedHost);
      const account =
        await repository.selectRemoteAccountByLowerUsernameAndHost(
          userpart, host);

      if (account) {
        return account.selectPerson(repository);
      }

      const firstFinger = await lookup(acct);
      const { href } =
        firstFinger.object.links.find(({ rel }) => rel == 'self');
      const asyncActivityStreams = getActivityStreams(href);
      const secondFinger = await lookup(href);

      if (firstFinger.object.subject != secondFinger.object.subject) {
        throw new Error;
      }

      const activityStreams = await asyncActivityStreams;
      return this.fromActivityStreams(repository, host, activityStreams);
    }

    const account =
      await repository.selectLocalAccountByLowerUsername(userpart);

    return account.selectPerson(repository);
  }

  static async resolveByKeyUri(repository, uri) {
    const account = await repository.selectRemoteAccountByKeyUri(uri);

    if (account) {
      return account.selectPerson(repository);
    }

    const object = await getActivityStreams(uri);
    const [{ object: firstFinger }] = await Promise.all([
      lookup(object.getId()),
      object.getPublicKey().then(key => {
        if (key.getId() != uri) {
          throw new Error;
        }
      })
    ]);

    const normalizedFirstSubject = firstFinger.subject.replace(/^acct:/, '');
    const { object: secondFinger } = await lookup(normalizedFirstSubject);

    if (firstFinger.subject != secondFinger.subject) {
      throw new Error;
    }

    const [, encodedHost] = firstFinger.subject.toLowerCase().split('@', 2);
    const host = domainToUnicode(encodedHost);

    return this.fromActivityStreams(repository, host, object);
  }
}
