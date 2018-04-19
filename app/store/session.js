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

async function createSession(user, { access_token, refresh_token }) {
  if (refresh_token) {
    localStorage.setItem(this.get('refreshTokenKey'), refresh_token);
    localStorage.setItem(this.get('usernameKey'), user.username);
  }

  user.inbox = [];
  this.set({ accessToken: access_token, user });
}

export default {
  async oauth(fetch, username, params) {
    const personResponse = await this.fetchPerson(fetch, username);
    const user = await personResponse.json();

    const fetched = await fetch(user.oauthTokenEndpoint, {
      method: 'POST',
      body: new URLSearchParams(params)
    });

    createSession.call(this, user, await fetched.json());
  },

  async signup(fetch, username, params) {
    const sessionResponse = await fetch('/api/signup', {
      method: 'POST',
      body: new URLSearchParams(params)
    });

    const [person, session] = await Promise.all([
      this.fetchPerson(fetch, username)
          .then(personResponse => personResponse.json()),
      sessionResponse.json()
    ]);

    createSession.call(this, person, session);
  }
}
