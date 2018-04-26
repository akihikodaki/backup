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
import { URL } from 'url';

const requestings = new WeakMap;

export default class {
  constructor(iterable) {
    requestings.set(this, new Set(iterable));
  }

  async function resolve(value) {
    const requesting = requestings.get(this);

    if (requesting.has(value)) {
      throw new Error;
    }

    const resolver = new Resolver(requesting);
    const { protocol, hostname, port, pathname, search } = new URL(value);
    let json = '';

    requesting.get(resolver).add(value);

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

    if (object === null || (
      Array.isArray(object['@context']) ?
        !object['@context'].includes('https://www.w3.org/ns/activitystreams') :
        object['@context'] !== 'https://www.w3.org/ns/activitystreams'
    )) {
      throw new Error();
    }

    return { resolver, object };
  }
}
