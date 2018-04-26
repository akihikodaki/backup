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

export default class {
  constructor(body, resolver = new Resolver) {
    this.body = body;
    resolvers.set(this, resolver);
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
    return typeof this.body == 'string' ? this.body : this.body.id;
  }

  async getInbox() {
    await load.call(this);
    return new this.constructor(this.body.inbox, resolvers.get(this));
  }

  async getObject() {
    await load.call(this);
    return new this.constructor(this.body.object, resolvers.get(this));
  }

  async getPreferredUsername() {
    await load.call(this);

    return new this.constructor(
      this.body.preferredUsername,
      resolvers.get(this));
  }

  async getPublicKey() {
    await load.call(this);
    return new this.constructor(this.body.publicKey, resolvers.get(this));
  }

  async getPublicKeyPem() {
    await load.call(this);
    return this.body.publicKeyPem;
  }

  async getText() {
    await load.call(this);
    return this.body.text;
  }

  async act(repository, actor) {
    await load.call(this);

    switch (this.body.type) {
    case 'Follow':
      await Follow.fromActivityStreams(repository, actor, this);
      break;

    case 'Note':
      const note = await Note.fromActivityStreams(repository, actor, this);
      const followers = await repository.selectLocalAccountsByFollowee(actor);

      await repository.insertIntoInboxes(followers, note);
      break;
    }
  }
};
