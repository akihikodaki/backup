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
import Activity from '../../lib/activity';
import OrderedCollection from '../../lib/ordered_collection';
import OauthOwner from '../../lib/oauth/owner';

const middleware = json({
  type: ['application/activity+json', 'application/ld+json']
});

export function get({ params, repository }, response, next) {
  const [userpart, host] = params.acct.toLowerCase().split('@', 2);

  repository.selectRecentNotesByLowerUsernameAndHost(userpart, host).then(
    async orderedItems => {
      const collection = new OrderedCollection({ orderedItems });
      const activityStreams = await collection.toActivityStreams(repository);

      activityStreams['@context'] = 'https://www.w3.org/ns/activitystreams';
      response.json(activityStreams);
    }).catch(next);
}

export function post(request, response, next) {
  OauthOwner.middleware(request, response, () => {
    middleware(request, response, () => {
      const { account, repository } = request;

      account.selectPerson(repository).then(async person => {
        if (request.params.acct == person.username) {
          await Activity.act(repository, person, request.body);
          response.sendStatus(201);
        } else {
          response.sendStatus(401);
        }
      }).catch(next);
    });
  });
}
