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

const resolvers = new WeakMap;

async function load() {
  if (typeof this.body == 'string') {
    const { resolver, object } = await resolvers.get(this).resolve(value);

    resolvers.set(this, resolver);
    this.body = object;
  }
}

function getChild(body) {
  const object = new this.constructor(body, resolvers.get(this));

  if (body.id && this.body.id) {
    const idUrl = new URL(body.id);
    const referrerUrl = new URL(this.body.id);

    if (idUrl.host != referrerUrl.host) {
      object.body = id;
    }
  }
}

export class TypeNotAllowed extends Error {}

export default class {
  constructor(body, resolver = new Resolver) {
    this.body = body;
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
    const resolver = resolvers.get(this);

    await load.call(this);

    switch (this.body.type) {
    case 'Collection':
      return this.body.items.map(item => new this.constructor(this, resolver));

    case 'OrderedCollection':
      return this.body
                 .orderedItems
                 .map(item => new this.constructor(this, resolver));

    default:
      return Array.isArray(this.body) ? this.body : [this];
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
      const object = await this.getObject();
      await object.create(repository, actor);
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
      const note =
        await Note.fromActivityStreams(repository, attributedTo, this);

      const followers =
        await repository.selectLocalAccountsByFollowee(attributedTo);

      await repository.insertIntoInboxes(followers, note);
      break;

    default:
      throw new TypeNotAllowed;
    }
  }
};
