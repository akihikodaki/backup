/*
  Copyright (C) 2018  Miniverse authors

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
import { Custom as CustomError } from '../errors';
import Announce from '../tuples/announce';
import Create from '../tuples/create';
import Delete from '../tuples/delete';
import Follow from '../tuples/follow';
import Like from '../tuples/like';
import Undo from '../tuples/undo';
import { normalizeHost } from '../tuples/uri';
import Resolver from './resolver';

function load() {
  const { repository, referenceId, parentContent } = this;

  if (!this.content) {
    this.content = parentContent.then(async ({ context, resolver }) => {
      const resolved = await resolver.resolve(repository, referenceId);

      if (!resolved.context) {
        resolved.context = context;
      }

      return resolved;
    });
  }

  return this.content;
}

function getChild(body) {
  const content = load.call(this);

  return body &&
    new this.constructor(this.repository, body, this.normalizedHost, content);
}

export const AnyHost = {};
export const NoHost = {};
export class TypeNotAllowed extends Error {}

export default class {
  constructor(repository, body, normalizedHost, parentContent = Promise.resolve({
    context: null,
    resolver: new Resolver
  })) {
    if (body instanceof Object) {
      if (body.id) {
        const { host } = new URL(body.id);

        this.normalizedHost = normalizeHost(host);

        if ([AnyHost, this.normalizedHost].includes(normalizedHost)) {
          this.referenceId = null;
          this.content = parentContent.then(({ resolver, context }) => ({
            resolver,
            context: body['@context'] || context,
            body
          }));
        } else {
          this.referenceId = body.id;
          this.content = null;
        }
      } else {
        this.referenceId = null;
        this.normalizedHost = normalizedHost;
        this.content = parentContent.then(({ resolver, context }) => ({
          resolver,
          context: body['@context'] || context,
          body
        }));
      }
    } else {
      const { host } = new URL(body);

      this.normalizedHost = normalizeHost(host);
      this.referenceId = body;
      this.content = null;
    }

    this.repository = repository;
    this.parentContent = parentContent;
  }

  async getActor() {
    const { body } = await load.call(this);
    return getChild.call(this, body.actor);
  }

  async getAttachment() {
    const { body } = await load.call(this);
    const collection = await getChild.call(this, body.attachment);
    return collection.getItems();
  }

  async getAttributedTo() {
    const { body } = await load.call(this);
    return getChild.call(this, body.attributedTo);
  }

  async getContent() {
    const { body } = await load.call(this);
    return body.content;
  }

  async getContext() {
    const { context } = await load.call(this);
    return new Set(Array.isArray(context) ? context : [context]);
  }

  async getHref() {
    const { body } = await load.call(this);
    return body.href;
  }

  async getItems() {
    const getChildOfThis = getChild.bind(this);
    const [{ body }, type] = await Promise.all([
      load.call(this),
      this.getType()
    ]);

    if (type.has('OrderedCollection')) {
      return body.orderedItems.map(getChildOfThis);
    }

    if (type.has('Collection')) {
      return body.items.map(getChildOfThis);
    }

    if (Array.isArray(body)) {
      return body.map(getChildOfThis);
    }

    return [this];
  }

  async getId() {
    if (this.referenceId) {
      return this.referenceId;
    }

    if (this.content) {
      return (await this.content).body.id;
    }

    throw new CustomError(
      'id is not given. Possibly invalid Activity Streams?', 'info');
  }

  async getInbox() {
    const { body } = await load.call(this);
    return getChild.call(this, body.inbox);
  }

  async getInReplyTo() {
    const { body } = await load.call(this);
    return getChild.call(this, body.inReplyTo);
  }

  async getName() {
    const { body } = await load.call(this);
    return body.name;
  }

  async getObject() {
    const { body } = await load.call(this);
    return getChild.call(this, body.object);
  }

  async getOwner() {
    const { body } = await load.call(this);
    return getChild.call(this, body.owner);
  }

  async getPreferredUsername() {
    const { body } = await load.call(this);
    return body.preferredUsername;
  }

  async getPublicKey() {
    const { body } = await load.call(this);
    return getChild.call(this, body.publicKey);
  }

  async getPublicKeyPem() {
    const { body } = await load.call(this);
    return body.publicKeyPem;
  }

  async getPublished() {
    const { body } = await load.call(this);
    return body.published && new Date(body.published);
  }

  async getSummary() {
    const { body } = await load.call(this);
    return body.summary;
  }

  async getTag() {
    const { body } = await load.call(this);
    const collection = await getChild.call(this, body.tag);
    return collection.getItems();
  }

  async getTo() {
    const { body } = await load.call(this);
    const collection = await getChild.call(this, body.to);

    return body.to === 'https://www.w3.org/ns/activitystreams#Public' ?
      [collection] : collection.getItems();
  }

  async getType() {
    const { body: { type } } = await load.call(this);
    return new Set(Array.isArray(type) ? type : [type]);
  }

  async getUrl() {
    const { body } = await load.call(this);
    const normalized =
      typeof body.url == 'string' ? { type: 'Link', href: body.url } : body.url;

    return await getChild.call(this, normalized);
  }

  async act(actor) {
    const uri = await this.getId();
    if (uri) {
      const entity = await this.repository.selectAllocatedURI(uri);
      if (entity) {
        return uri;
      }
    }

    await Promise.all([
      Promise.all([
        this.getActor().then(actual => actual && actual.getId()),
        actor.getUri()
      ]).then(([actual, expected]) => {
        if (actual && actual != expected) {
          throw new CustomError(
            'Given actor and actor in Activity Streams mismatch. Possibly invalid Activity Streams?',
            'info');
        }
      })
    ]);

    for (const Constructor of [Delete, Follow, Like, Undo]) {
      try {
        await Constructor.createFromParsedActivityStreams(
          this.repository, this, actor);

        return null;
      } catch (error) {
        if (!(error instanceof TypeNotAllowed)) {
          throw error;
        }
      }
    }

    let created;

    try {
      created = await Announce.createFromParsedActivityStreams(
        this.repository, this, actor);
    } catch (error) {
      if (!(error instanceof TypeNotAllowed)) {
        throw error;
      }

      created = await Create.createFromParsedActivityStreams(
        this.repository, this, actor);

      created = await created.select('object');
    }

    created = await created.select('status');
    return created.getUri();
  }
}