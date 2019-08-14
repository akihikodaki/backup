/*
  Copyright (C) 2019  Miniverse authors

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

export interface Note {
  readonly attributedTo: string;
  readonly content: string;
  readonly likes: number;
  readonly published: Date;
  readonly references: number;
}

export type OutboxItem =
  { readonly type: 'Announce'; readonly object: string } |
  { readonly type: 'Note'; readonly id: string };

export type OutboxSection = {
  readonly date: Date,
  readonly data: ReadonlyArray<OutboxItem>
};

export default interface State {
  readonly actors: ReadonlyMap<string, {
    readonly announces: ReadonlyMap<string, {
      readonly references: number;
    }>;
    readonly following?: boolean;
    readonly name: string;
    readonly outbox: string;
    readonly preferredUsername: string;
    readonly references: number;
  }>;
  readonly notes: ReadonlyMap<string, Note>;
  readonly page: {
    readonly actor: null | {
      readonly acct: string;
      readonly notFound: boolean;
      readonly outbox: ReadonlyArray<OutboxSection>;
    };
    readonly note: null | {
      readonly id: string;
      readonly params: {
        readonly acct: string;
        readonly id: string;
      };
      readonly notFound: boolean;
    };
  };
  readonly session: {
    readonly endpoints: { readonly proxyUrl: string };
    readonly fingerHost: string;
    readonly host: string;
    readonly nonce: string;
    readonly user: null | string;
  };
}
