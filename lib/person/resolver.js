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
import ActivityStreams from '../activitystreams';
const WebFinger = require('webfinger.js');

const webFinger = new WebFinger({ tls_only: false });
const lookup = promisify(webFinger.lookup.bind(webFinger));

async function getActivityStreams(href) {
  const { protocol, host, hostname, port, pathname, search } = new URL(href);
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

  const object = new ActivityStreams(JSON.parse(json), { host });

  object.validateContext();

  if (object.type != 'Person') {
    throw new Error;
  }

  return object;
}

export default {
  async resolveByAcct(repository, acct) {
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
  },

  async resolveByKeyUri(repository, uri) {
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
};
