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

function createSession(sessionUsername, { access_token, refresh_token }) {
  this.set({
    sessionUsername,
    sessionAccessToken: access_token
  });

  if (refresh_token) {
    localStorage.setItem(this.get('sessionRefreshTokenKey'), refresh_token);
    localStorage.setItem(this.get('sessionUsernameKey'), sessionUsername);
  }

  return this.fetchPerson(fetch, sessionUsername);
}

export default {
  async oauth(fetch, username, params) {
    const fetched = await fetch('/oauth/token', {
      method: 'POST',
      body: new URLSearchParams(params)
    });

    createSession.call(this, username, await fetched.json());
  },

  async signup(fetch, username, params) {
    const fetched = await fetch('/api/signup', {
      method: 'POST',
      body: new URLSearchParams(params)
    });

    createSession.call(this, username, await fetched.json());
  }
}
