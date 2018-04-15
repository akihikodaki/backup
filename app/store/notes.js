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

import { fetchAuthorized } from './fetch';

export default function() {
  this.createNote = function(fetch, text) {
    const { outbox } = this.get('persons')[this.get('sessionUsername')];

    return fetchAuthorized.call(this, fetch, outbox, {
      method: 'POST',
      headers: { 'Content-Type': 'application/activity+json' },
      body: JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Note',
        text,
      })
    });
  };
}
