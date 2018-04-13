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

import { Store } from 'svelte/store';

export default class extends Store {
  constructor() {
    super({
      persons: Object.create(null),
      sessionAccessToken: null,
      sessionUsername: null,
      streaming: null
    });
  }

  fetch(method, url, callback) {
    return new Promise((resolve, reject) => {
      const instance = new XMLHttpRequest;

      instance.onload = resolve;
      instance.onerror = reject;
      instance.open(method, url);

      callback(instance);
    });
  }

  fetchAuthorized(method, url, callback) {
    return this.fetch(method, url, instance => {
      const accessToken = this.get('sessionAccessToken');
      instance.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      callback(instance);
    });
  }

  async fetchPerson(username) {
    const { target: { response } } = await this.fetch('GET', '/@' + username, instance => {
      instance.responseType = 'json';
      instance.send();
    });

    this.set({
      persons: Object.assign(Object.create(null), this.get('persons'), {
        [response.preferredUsername]: response
      })
    });
  }

  stream() {
    const streaming = new WebSocket(`wss://${location.host}/api/v0/streaming`);
    streaming.onmessage = console.log;
    this.set('streaming', streaming);
  }
}
