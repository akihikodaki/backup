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

import { postOutbox } from './fetch';

export default {
  async fetchOutbox(fetch, username) {
    const persons = this.get('persons');
    const person = persons[username];
    const fetched = await fetch(person.outbox, {
      headers: { Accept: 'application/activity+json;q=0.9,application/ld+json;q=0.8' }
    });
    const body = await fetched.json();

    this.set({
      persons: Object.assign(Object.create(null), persons, {
        [username]: Object.assign(person, { outbox: body })
      })
    });

    return fetched;
  },

  async fetchPerson(fetch, username) {
    const fetched = await fetch('/@' + username, {
      headers: { Accept: 'application/activity+json;q=0.9,application/ld+json;q=0.8' }
    });
    const body = await fetched.json();

    this.set({
      persons: Object.assign(Object.create(null), this.get('persons'), {
        [body.preferredUsername]: body
      })
    });

    return fetched;
  },

  follow(fetch, username) {
    return postOutbox.call(this, fetch, {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Follow',
      object: this.get('persons')[username].id,
    });
  }
}
