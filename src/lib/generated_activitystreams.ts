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

import { URL } from 'isomorphism/url';

export function generateAcct({ id, preferredUsername }: Actor) {
  return `${preferredUsername}@${(new URL(id)).host}`;
}

export interface Accept {
  type: 'Accept';
  object: Follow;
}

export interface Announce {
  type: 'Announce';
  id?: string;
  published: string;
  object: Note;
}

export type Any = Accept | Actor | Announce | Create |
Document | Follow | Key | LocalActor |
Note | OrderedCollection | OrderedCollectionPage;

export interface Actor {
  id: string;
  preferredUsername: string;
  name: string;
  summary: string;
  inbox: string;
  outbox: string;
  type: 'Object' | 'Person';
  'miniverse:following'?: boolean;
}

export interface Create {
  type: 'Create';
  id?: string;
  object: Document | Note;
}

export interface Document {
  type: 'Document';
  mediaType: string;
  url: string;
}

export interface Endpoints {
  proxyUrl: string;
  uploadMedia: string;
}

export interface Follow {
  type: 'Follow';
  actor: string;
  object: string;
}

export interface Hashtag {
  type: 'Hashtag';
  name: string;
}

export interface Key {
  id: string;
  type: 'Key';
  owner: string;
  publicKeyPem: string;
}

export interface Like {
  type: 'Like';
  object: string;
}

export interface LocalActor extends Actor {
  type: 'Person';
  endpoints: Endpoints;
  publicKey: Key;
  'miniverse:salt': string;
}

export interface Mention {
  type: 'Mention';
  href: string;
}

export interface Note {
  type: 'Note';
  id: string;
  published: string;
  attributedTo: Actor;
  inReplyTo: string | null;
  to: string;
  summary: string | null;
  content: string;
  attachment: Document[];
  tag: (Hashtag | Mention)[];
  'miniverse:reaction': {
    type: 'OrderedCollection';
    totalItems: number;
    'miniverse:itemType': 'Like';
  }
}

export interface OrderedCollection {
  type: 'OrderedCollection';
  orderedItems: Any[];
}

export interface OrderedCollectionPage {
  type: 'OrderedCollectionPage';
  orderedItems: Any[];
}

export type StringifiableTo<T extends Any> = {
  [key in keyof T]:
    T[key] extends string ? Date | string :
    T[key] extends Any ? StringifiableTo<T[key]> :
    T[key] extends (infer U)[] ? (U extends Any ? StringifiableTo<U> : U)[] :
    T[key];
};
