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

export default class {
  constructor({ account, id, username }) {
    if (account) {
      account.person = this;
      account.personId = id;
      this.account = account;
    }

    this.id = id;
    this.username = username;
  }

  toActivityStreams({ origin }) {
    const id = `${origin}/@${encodeURI(this.username)}`;

    return {
      id,
      type: 'Person',
      preferredUsername: this.username,
      oauthTokenEndpoint: `${origin}/oauth/token`,
      inbox: id + '/inbox',
      outbox: id + '/outbox'
    };
  }

  toWebFinger({ host, origin }) {
    const uriUsername = encodeURI(this.username);

    return {
      subject: `acct:${uriUsername}@${toASCII(host)}`,
      links: [
        {
          rel: 'self',
          type: 'application/activity+json',
          href: `${origin}/@${uriUsername}`,
        }
      ]
    };
  }

  static create(username) {
    return new this({ username });
  }
}
