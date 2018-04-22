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
import { toASCII, toUnicode } from 'punycode';
import { URL } from 'url';
import { promisify } from 'util';
import { extractPublic } from '../key';
import LocalAccount from './local_account';
import RemoteAccount from './remote_account';
import URI from './uri';
const WebFinger = require('webfinger.js');

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

  const activityStreams = JSON.parse(json);
  const context = activityStreams['@context'];

  if ((Array.isArray(context) ?
        !context.includes('https://www.w3.org/ns/activitystreams') :
        context != 'https://www.w3.org/ns/activitystreams') ||
        activityStreams.type != 'Person') {
    throw new Error;
  }

  return activityStreams;
}

export default class {
  constructor(properties) {
    Object.assign(this, properties);

    if (account) {
      this.account.person = this;
    }
  }

  async getUri(repository) {
    if (this.host) {
      const account = await repository.selectRemoteAccountByPerson(this);
      return account.uri;
    }

    return `${repository.origin}/@${URI.encodeSegment(this.username)}`;
  }

  async toActivityStreams(repository) {
    if (this.host) {
      const acct = URI.encodeSegment(`${this.username}@${this.host}`);
      const id = `${repository.origin}/@${acct}`;

      return {
        id,
        type: 'Person',
        preferredUsername: this.username,
        inbox: id + '/inbox',
        outbox: id + '/outbox'
      };
    }

    const account = await repository.selectLocalAccountByPerson(this);
    const id = await this.getUri(repository);

    return {
      id,
      type: 'Person',
      preferredUsername: this.username,
      oauthTokenEndpoint: `${repository.origin}/oauth/token`,
      inbox: id + '/inbox',
      outbox: id + '/outbox',
      publicKey: {
        type: 'Key',
        publicKeyPem: extractPublic(account.privateKeyPem)
      }
    };
  }

  static async fromActivityStreams(repository, host, { id, publicKey, preferredUsername: username }) {
    const idUrl = new URL(id);
    const publicKeyIdUrl = new URL(publicKey.id);

    if (idUrl.host.toLowerCase() != publicKeyIdUrl.host.toLowerCase()) {
      throw new Error;
    }

    const person = new this({
      account: new RemoteAccount({ uri: id, publicKey }),
      username,
      host
    });

    await repository.insertRemoteAccount(person.account);
    return person;
  }

  static async resolveByAcct(repository, acct) {
    const [encodedUserpart, encodedHost] = acct.toLowerCase().split('@', 2);
    const userpart = decodeURI(encodedUserpart);

    if (encodedHost) {
      const host = encodedHost && toUnicode(encodedHost);
      const account =
        await repository.selectRemoteAccountByLowerUsernameAndHost(
          userpart, host);

      if (account) {
        return repository.selectPersonByRemoteAccount(account);
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

    return repository.selectPersonByLocalAccount(account);
  }

  static async resolveByKeyId(repository, id) {
    const account = await repository.selectRemoteAccountByKeyId(id);

    if (account) {
      return account;
    }

    const activityStreams = await getActivityStreams(id);

    if (activityStreams.publicKey.id != id) {
      throw new Error;
    }

    const { object: firstFinger } = await lookup(activityStreams.id);
    const normalizedFirstSubject = firstFinger.subject.replace(/^acct:/, '');
    const { object: secondFinger } = await lookup(normalizedFirstSubject);

    if (firstFinger.subject != secondFinger.subject) {
      throw new Error;
    }

    const [, encodedHost] = firstFinger.subject.toLowerCase().split('@', 2);
    const host = toUnicode(encodedHost);

    return this.fromActivityStreams(repository, host, activityStreams);
  }
}
