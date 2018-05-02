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

import Follow from '../follow';
import Note from '../note';
import URI from '../uri';
import Resolver from './resolver';

const resolvers = new WeakMap;

async function load(repository) {
  if (typeof this.body == 'string') {
    const { resolver, object } =
      await resolvers.get(this).resolve(repository, this.body);

    resolvers.set(this, resolver);
    this.body = object;
  }
}

function getChild(body) {
  return new this.constructor(body, {
    normalizedHost: this.normalizedHost,
    resolver: resolvers.get(this)
  });
}

export const AnyHost = {};
export const NoHost = {};
export class TypeNotAllowed extends Error {}

export default class {
  constructor(body, { normalizedHost, resolver = new Resolver } = {}) {
    if (typeof body == 'string') {
      const url = new URL(body);

      this.body = body;
      this.normalizedHost = URI.normalizeHost(url.host);
    } else if (body.id) {
      const url = new URL(body.id);

      this.normalizedHost = URI.normalizeHost(url.host);
      this.body =
        normalizedHost == AnyHost || normalizedHost == this.normalizedHost ?
          body : body.id;
    } else {
      this.body = body;
      this.normalizedHost = normalizedHost;
    }

    resolvers.set(this, resolver);
  }

  async getActor(repository) {
    await load.call(this, repository);
    return getChild.call(this, this.body.actor);
  }

  async getAttributedTo(repository) {
    await load.call(this, repository);
    return getChild.call(this, this.body.attributedTo);
  }

  async getContent(repository) {
    await load.call(this, repository);
    return this.body.content;
  }

  async getItems(repository) {
    const getChildOfThis = getChild.bind(this);

    await load.call(this, repository);

    switch (this.body.type) {
    case 'Collection':
      return this.body.items.map(getChildOfThis);

    case 'OrderedCollection':
      return this.body
                 .orderedItems
                 .map(getChildOfThis);

    default:
      return Array.isArray(this.body) ? this.body.map(getChildOfThis) : [this];
    }
  }

  getId() {
    return this.body instanceof Object ? this.body.id : this.body;
  }

  async getInbox(repository) {
    await load.call(this, repository);
    return getChild.call(this, this.body.inbox);
  }

  async getObject(repository) {
    await load.call(this, repository);
    return getChild.call(this, this.body.object);
  }

  async getPreferredUsername(repository) {
    await load.call(this, repository);
    return this.body.preferredUsername;
  }

  async getPublicKey(repository) {
    await load.call(this, repository);
    return getChild.call(this, this.body.publicKey);
  }

  async getPublicKeyPem(repository) {
    await load.call(this, repository);
    return this.body.publicKeyPem;
  }

  async getType(repository) {
    await load.call(this, repository);
    return this.body.type;
  }

  async act(repository, actor) {
    const [type] = await Promise.all([
      this.getType(repository),
      Promise.all([
        this.getActor(repository),
        actor.getUri(repository)
      ]).then(([actual, expected]) => {
        const id = actual.getId();

        if (id && id != expected) {
          throw new Error;
        }
      })
    ]);

    switch (type) {
    case 'Create':
      await (await this.getObject(repository)).create(repository, actor);
      break;

    case 'Follow':
      await Follow.fromActivityStreams(repository, actor, this);
      break;

    default:
      throw new TypeNotAllowed;
    }
  }

  async create(repository, attributedTo) {
    const [type] = await Promise.all([
      this.getType(repository),
      Promise.all([
        this.getAttributedTo(repository),
        attributedTo.getUri(repository)
      ]).then(([actual, expected]) => {
        const id = actual.getId();

        if (id && id != expected) {
          throw new Error;
        }
      })
    ]);

    switch (type) {
    case 'Note':
      await Note.fromActivityStreams(repository, attributedTo, this);
      break;

    default:
      throw new TypeNotAllowed;
    }
  }
}
