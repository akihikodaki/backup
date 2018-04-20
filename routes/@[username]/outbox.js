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
import Follow from '../../app/server/models/follow';
import Note from '../../app/server/models/note';
import OrderedCollection from '../../app/server/models/ordered_collection';
import { middleware as oauthOwner } from '../../app/server/oauth/owner';

const middleware = json({
  type: ['application/activity+json', 'application/ld+json']
});

export function get({ params, server }, response, next) {
  const lowerUsername = params.username.toLowerCase();

  server.selectRecentNotesByLowerUsername(lowerUsername).then(orderedItems => {
    const collection = new OrderedCollection({ orderedItems });
    const activityStreams = collection.toActivityStreams(server);

    activityStreams['@context'] = 'https://www.w3.org/ns/activitystreams';
    response.json(activityStreams);
  }).catch(next);
}

export function post(request, response, next) {
  oauthOwner(request, response, () => middleware(request, response, async () => {
    try {
      const person =
        await request.server.selectPersonByLocalAccount(request.account);

      if (request.params.username !== person.username) {
        response.sendStatus(401);
        return;
      }

      if (Array.isArray(request.body['@context']) ?
            !request.body['@context'].includes('https://www.w3.org/ns/activitystreams') :
            request.body['@context'] !== 'https://www.w3.org/ns/activitystreams') {
        response.sendStatus(400);
        return;
      }

      const localUserPrefix = `${process.env.ORIGIN}/@`;

      switch (request.body.type) {
      case 'Follow':
        const follow = await Follow.fromActivityStreams(
          request.server, person, request.body);

        if (follow) {
          await request.server.insertFollow(follow);
        } else {
          response.sendStatus(422);
        }
        break;

      case 'Note':
        const note = Note.fromActivityStreams(request.person, request.body);
        const [followers] = await Promise.all([
          request.server.selectLocalAccountsByFollowee(request.person),
          request.server.insertNote(note)
        ]);

        await request.server.insertIntoInboxes(followers, note);
        break;

      default:
        response.sendStatus(400);
        return;
      }
    } catch (error) {
      next(error);
    }

    response.sendStatus(201);
  }));
}
