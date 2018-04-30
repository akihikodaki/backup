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
import Resolver from './resolver';

const hosts = new WeakMap;
const resolvers = new WeakMap;

async function load() {
  if (typeof this.body == 'string') {
    const { resolver, object } = await resolvers.get(this).resolve(this.body);

    resolvers.set(this, resolver);
    this.body = object;
  }
}

function getChild(body) {
  return new this.constructor(body, {
    host: hosts.get(this),
    resolver: resolvers.get(this)
  });
}

export class TypeNotAllowed extends Error {}

export default class {
  constructor(body, { host, resolver = new Resolver } = {}) {
    if (typeof body == 'string') {
      const url = new URL(body);

      this.body = body;
      hosts.set(this, url.host);
    } else if (body.id) {
      const url = new URL(body.id);

      this.body = url.host == host ? body : body.id;
      hosts.set(this, url.host);
    } else {
      hosts.set(this, host);
    }

    resolvers.set(this, resolver);
  }

  async getActor() {
    await load.call(this);
    return getChild.call(this, this.body.actor);
  }

  async getAttributedTo() {
    await load.call(this);
    return getChild.call(this, this.body.attributedTo);
  }

  async getContent() {
    await load.call(this);
    return this.body.content;
  }

  async getItems() {
    const getChildOfThis = getChild.bind(this);

    await load.call(this);

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

  async getInbox() {
    await load.call(this);
    return getChild.call(this, this.body.inbox);
  }

  async getObject() {
    await load.call(this);
    return getChild.call(this, this.body.object);
  }

  async getPreferredUsername() {
    await load.call(this);
    return this.body.preferredUsername;
  }

  async getPublicKey() {
    await load.call(this);
    return getChild.call(this, this.body.publicKey);
  }

  async getPublicKeyPem() {
    await load.call(this);
    return this.body.publicKeyPem;
  }

  async getType() {
    await load.call(this);
    return this.body.type;
  }

  async act(repository, actor) {
    const [type] = await Promise.all([
      this.getType(),
      Promise.all([
        this.getActor(),
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
      await (await this.getObject()).create(repository, actor);
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
      this.getType(),
      Promise.all([
        this.getAttributedTo(),
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
      await repository.insertIntoInboxes(
        await repository.selectLocalAccountsByFollowee(attributedTo),
        await Note.fromActivityStreams(repository, attributedTo, this));
      break;

    default:
      throw new TypeNotAllowed;
    }
  }
}
