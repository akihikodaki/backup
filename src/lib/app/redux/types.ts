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

import { Dispatch } from 'redux';
import { Reducible } from './action';
import State from './state';

interface Headers {
  readonly [key: string]: string | undefined;
}

type Response = null | {
  body: unknown;
  headers: object;
  status: number;
};

export interface Plain {
  get(headers: Headers, url: string): Promise<Response>;
  postJSON(headers: Headers, url: string, body: unknown): Promise<Response>;
  postUrlencoded(headers: Headers, url: string, body: {}): Promise<Response>;
}

export interface MiddlewareAPI {
  dispatch<T extends Action>(t: T): T;
  getState(): State;
}

export interface Ext extends Dispatch<Reducible> {
  <T extends (api: MiddlewareAPI, plain: Plain) => void>(t: T): T;
}

export type Action = Reducible | ((api: MiddlewareAPI) => void);
