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

import Follow from './follow';
import Note from './note';

export default class {
  constructor(body) {
    this.body = body;
  }

  getId() {
    return typeof this.body == 'string' ? this.body : this.body.id;
  }

  getPublicKey() {
    return new this.constructor(this.body.publicKey);
  }

  validateContext() {
    if (Array.isArray(this.body['@context']) ?
          !this.body['@context'].includes('https://www.w3.org/ns/activitystreams') :
          this.body['@context'] != 'https://www.w3.org/ns/activitystreams') {
      throw new Error;
    }
  }

  async act(repository, actor) {
    switch (this.body.type) {
    case 'Follow':
      await Follow.fromActivityStreams(repository, actor, this);
      break;

    case 'Note':
      const note = await Note.fromActivityStreams(repository, actor, this);
      const followers = await repository.selectLocalAccountsByFollowee(actor);

      await repository.insertIntoInboxes(followers, note);
      break;
    }
  }
};
