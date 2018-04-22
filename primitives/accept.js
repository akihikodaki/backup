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

import { request } from 'http';
import { sign } from 'http-signature';
import Key from './key';

export default class {
  constructor(properties) {
    Object.assign(this, properties);
  }

  toActivityStreams() {
    return {
      type: 'Accept',
      actor: TODO,
      object: TODO,
    };
  }

  static async create(repository, follow) {
    const accept = new this({ follow });
    const [actor, object] = await Promise.all([
      repository.selectLocalAccountIncludingPersonByActorOfFollow(follow),
      repository.selectRemoteAccountByObjectOfFollow(follow)
    ]);

    if (actor && object) {
      const activityStreams = accept.toActivityStreams();
      const url = new URL(object.id);
      const [actorPerson, clientRequest] = await Promise.all([
        repository.selectPersonByLocalAccount(actor),
        new Promise((resolve, reject) => request({
          protocol,
          hostname,
          port,
          path: pathname + search,
          method: 'POST'
        }, response => {
          response.on('data', chunk => json += chunk);
          response.on('end', resolve);
        }).on('error', reject))
      ]);
      const key = new Key({ owner: actor });

      sign(clientRequest, {
        authorizationHeaderName: 'Signature',
        key: actor.privateKeyPem,
        keyId: await key.getUri()
      });

      activityStreams['@context'] = 'https://www.w3.org/ns/activitystreams';
      clientRequest.end(JSON.stringify(activityStreams));
    }
  }
}
