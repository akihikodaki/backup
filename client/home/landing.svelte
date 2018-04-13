<!--
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
-->

<div>
  <form on:submit='signin(event)'>
    <input name='username' placeholder='Username' type='text' />
    <input name='password' placeholder='Password' type='password' />
    <button>Sign in</button>
  </form>
  <form on:submit='signup(event)'>
    <input name='username' placeholder='Username' type='text' />
    <input name='password' placeholder='Password' type='password' />
    <button>Sign up</button>
  </form>
</div>
<script>
  function createSession(store, sessionUsername, { response }) {
    store.set({
      sessionUsername,
      sessionAccessToken: response.access_token
    });

    return store.fetchPerson(sessionUsername);
  }

  export default {
    methods: {
      signin(event) {
        const username = event.target.elements.username.value;
        const password = event.target.elements.password.value;

        event.preventDefault();

        this.store.fetch('POST', '/oauth/token', instance => {
          instance.responseType = 'json';
          instance.send(new URLSearchParams({
            grant_type: 'password',
            username,
            password
          }));
        }).then(({ target }) => createSession(this.store, username, target));
      },

      signup(event) {
        const username = event.target.elements.username.value;
        const password = event.target.elements.password.value;

        event.preventDefault();

        this.store.fetch('POST', '/api/v0/signup', instance => {
          instance.responseType = 'json';
          instance.send(new URLSearchParams({ username, password }));
        }).then(({ target }) => createSession(this.store, username, target));
      }
    }
  };
</script>
