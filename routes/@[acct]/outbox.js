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

import { json } from 'express';
import act from '../../app/server/act';
import OrderedCollection from '../../app/server/models/ordered_collection';
import { middleware as oauthOwner } from '../../app/server/oauth/owner';

const middleware = json({
  type: ['application/activity+json', 'application/ld+json']
});

export function get({ params, server }, response, next) {
  const [userpart, host] = params.acct.toLowerCase().split('@', 2);

  server.selectRecentNotesByLowerUsernameAndHost(userpart, host).then(
    async orderedItems => {
      const collection = new OrderedCollection({ orderedItems });
      const activityStreams = await collection.toActivityStreams(server);

      activityStreams['@context'] = 'https://www.w3.org/ns/activitystreams';
      response.json(activityStreams);
    }).catch(next);
}

export function post(request, response, next) {
  oauthOwner(request, response, () => middleware(request, response, () => {
    server.selectPersonByLocalAccount(request.account).then(async person => {
      if (request.params.acct == person.username) {
        await act(request.server, person, request.body);
        response.sendStatus(201);
      } else {
        response.sendStatus(401);
      }
    }).catch(next);
  }));
}
