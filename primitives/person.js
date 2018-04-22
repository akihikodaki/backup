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
const WebFinger = require('webfinger.js');

const webFinger = new WebFinger;
const lookup = promisify(webFinger.lookup.bind(webFinger));

export default class {
  constructor({ account, id, username, host }) {
    if (account) {
      account.person = this;
      account.personId = id;
      this.account = account;
    }

    this.id = id;
    this.username = username;
    this.host = host;
  }

  async toActivityStreams(repository) {
    if (this.host) {
      const acct = encodeURI(`${this.username}@${this.host}`);
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
    const id = `${repository.origin}/@${encodeURI(this.username)}`;

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

    const person =
      new this({ account: new RemoteAccount({ publicKey }), username, host });

    await repository.insertRemoteAccount(person.account);
    return person;
  }

  static async resolve(repository, acct) {
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
      const secondFinger = await lookup(href);
      const url = new URL(href);
      let json = '';

      if (firstFinger.subject != secondFinger.subject) {
        throw new Error;
      }

      await new Promise((resolve, reject) => get({
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
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

      return this.fromActivityStreams(repository, host, activityStreams);
    }

    const account =
      await repository.selectLocalAccountByLowerUsername(userpart);

    return repository.selectPersonByLocalAccount(account);
  }
}
