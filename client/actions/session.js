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

import { personFetch } from './persons';
import { request } from './request';

function sessionCreation(username, { response }) {
  return dispatch => Promise.all([
    dispatch(personFetch(username)),
    dispatch({
      type: 'SESSION_CREATION',
      username,
      accessToken: response.access_token
    })
  ]);
}

export function signin(username, password) {
  return dispatch => dispatch(request('POST', '/oauth/token', instance => {
    instance.responseType = 'json';
    instance.send(new URLSearchParams({
      grant_type: 'password',
      username,
      password
    }));
  })).then(({ target }) => dispatch(sessionCreation(username, target)));
}

export function signup(username, password) {
  return dispatch => dispatch(request('POST', '/api/v0/signup', instance => {
    instance.responseType = 'json';
    instance.send(new URLSearchParams({ username, password }));
  })).then(({ target }) => dispatch(sessionCreation(username, target)));
}

export function authorizedRequest(method, url, callback) {
  return (dispatch, getState) => dispatch(request(method, url, instance => {
    const { accessToken } = getState().session;
    instance.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    callback(instance);
  }));
}
