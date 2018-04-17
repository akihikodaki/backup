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

export function fetchAuthorized(fetch, url, options) {
  return fetch(url, Object.assign(options, {
    headers: Object.assign({
      Authorization: 'Bearer ' + this.get('sessionAccessToken')
    }, options.headers)
  }));
}

export function postOutbox(fetch, body) {
  const { outbox } = this.get('persons')[this.get('sessionUsername')];

  return fetchAuthorized.call(this, fetch, outbox, {
    headers: { 'Content-Type': 'application/activity+json' },
    method: 'POST',
    body: JSON.stringify(body)
  });
}
