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

import { AbortSignal } from 'abort-controller';
import { URL } from 'url';
import Repository from '../../../lib/repository';
import LocalAccount from '../../../lib/tuples/local_account';
import { get as getAcct } from './acct';
import { get as getAcctAttributedTo } from './acct/attributed_to';
import {
  get as getAcctOutbox,
  postJSON as postJSONAcctOutbox
} from './acct/outbox';
import { postUrlencoded as postUrlencodedApiProxy } from './api/proxy';
import { get as getDocument } from './document';
import { get as getWebFinger } from './webfinger';

export type Response = null | {
  body: unknown;
  headers: object;
  status: number;
};

export interface Headers {
  [header: string]: string | string[] | undefined;
}

export default class {
  readonly repository: Repository;
  readonly signal: AbortSignal;
  readonly headers: Headers;
  readonly user: LocalAccount | null;

  constructor(
    repository: Repository,
    signal: AbortSignal,
    headers: Headers,
    user: LocalAccount | null
  ) {
    this.repository = repository;
    this.signal = signal;
    this.headers = headers;
    this.user = user;
  }

  async get(url: string): Promise<Response> {
    const { pathname, searchParams } = new URL(url, 'https://192.0.0.8');
    const acctOutbox = pathname.match(/^\/@([^\/]*)\/outbox$/);
    if (acctOutbox) {
      return getAcctOutbox(this, decodeURIComponent(acctOutbox[1]));
    }

    const acctAttributedTo = pathname.match(/^\/@([^\/]*)\/(.*)/);
    if (acctAttributedTo) {
      return getAcctAttributedTo(
        this,
        decodeURIComponent(acctAttributedTo[1]),
        decodeURIComponent(acctAttributedTo[2]));
    }

    const acct = pathname.match(/^\/@(.*)/);
    if (acct) {
      return getAcct(this, decodeURIComponent(acct[1]));
    }

    if (pathname == '/.well-known/webfinger') {
      return getWebFinger(this, searchParams);
    }

    const document = pathname.match(/\/(.*)/);
    if (document) {
      return getDocument(this, decodeURIComponent(document[1]));
    }

    return null;
  }

  async postJSON(url: string, body: unknown): Promise<Response> {
    const { pathname } = new URL(url, 'https://192.0.0.8');
    const acctOutbox = pathname.match(/^\/@([^\/]*)\/outbox$/);
    if (acctOutbox) {
      return postJSONAcctOutbox(this, decodeURIComponent(acctOutbox[1]), body);
    }

    return null;
  }

  async postUrlencoded(url: string, body: {}): Promise<Response> {
    if ((new URL(url, 'https://192.0.0.8')).pathname == '/api/proxy') {
      return postUrlencodedApiProxy(this, body);
    }

    return null;
  }
}
