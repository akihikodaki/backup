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

import { request } from './request';

export function signin(username, password) {
  return dispatch => dispatch(request(
    'POST',
    '/oauth/token',
    new URLSearchParams({ grant_type: 'password', username, password })
  )).then(() => dispatch({ type: 'SESSION_CREATION' }));
}

export function signup(username, password) {
  return dispatch => dispatch(request(
    'POST',
    '/api/v0/signup',
    new URLSearchParams({ username, password })
  )).then(() => dispatch({ type: 'SESSION_CREATION' }));
}
