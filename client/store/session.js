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

import { fetch } from './fetch';

function createSession(sessionUsername, { response }) {
  this.set({
    sessionUsername,
    sessionAccessToken: response.access_token
  });

  return this.fetchPerson(sessionUsername);
}

export default function() {
  this.oauth = async function(username, params) {
    const { target } = fetch.call(this, 'POST', '/oauth/token', instance => {
      instance.responseType = 'json';
      instance.send(new URLSearchParams(params));
    });

    createSession.call(this, username, target);
  };

  this.signup = async function(username, params) {
    const { target } = fetch.call(this, 'POST', '/api/v0/signup', instance => {
      instance.responseType = 'json';
      instance.send(new URLSearchParams(params));
    });

    createSession.call(this, username, target);
  };
}
