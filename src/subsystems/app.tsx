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

import * as React from 'react';
import { hydrate } from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import AppReact from '../lib/app/react';
import { Reducible } from '../lib/app/redux/action';
import reducer from '../lib/app/redux/reducer';
import State from '../lib/app/redux/state';
import createThunk from '../lib/app/redux/create_thunk';
import { Ext } from '../lib/app/redux/types';
import {
  State as SerializedState,
  deserialize
} from '../lib/app/redux/serialization';

export default function(state: SerializedState, target: HTMLElement) {
  const enhancer = composeWithDevTools({ serialize: true })(createThunk({
    get(headers, url) {
      return fetch(url, {
        credentials: 'same-origin',
        headers: Object.entries(headers) as [string, string][],
        mode: 'cors'
      }).then(async response => ({
        body: response.ok ? await response.json() : null,
        headers: response.headers,
        status: response.status
      }));
    },

    postJSON(headers, url, body) {
      return fetch(url, {
        credentials: 'same-origin',
        headers: Object.entries(headers) as [string, string][],
        body: JSON.stringify(body),
        method: 'POST',
        mode: 'cors'
      }).then(async response => ({
        body: response.ok ? await response.json() : null,
        headers: response.headers,
        status: response.status
      }));
    },

    postUrlencoded(headers, url, body) {
      return fetch(url, {
        credentials: 'same-origin',
        headers: Object.entries(headers) as [string, string][],
        body: new URLSearchParams(body),
        method: 'POST',
        mode: 'cors'
      }).then(async response => ({
        body: response.ok ? await response.json() : null,
        headers: response.headers,
        status: response.status
      }));
    }
  }));

  const store = createStore<State, Reducible, { dispatch: Ext }, never>(
    reducer, deserialize(state), enhancer);

  hydrate(
    <Provider store={store}>
      <BrowserRouter><AppReact /></BrowserRouter>
    </Provider>,
    target
  );
}
