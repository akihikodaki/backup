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
import Follow from '../../app/server/entities/follow';
import Note from '../../app/server/entities/note';
import oauthOwner from '../../app/server/oauth/owner';

const middleware = json({
  type: ['application/activity+json', 'application/ld+json']
});

export function get({ params, repository }, response, next) {
  repository.selectRecentNotesByUsername(params.username).then(notes => {
    response.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      orderedItems: notes.map(({ text }) => ({ type: 'Note', text }))
    });
  }).catch(next);
}

export function post(request, response, next) {
  oauthOwner(request, response, () => middleware(request, response, async () => {
    try {
      if (request.params.username !== request.user.username) {
        response.sendStatus(401);
        return;
      }

      if ((Array.isArray(request.body['@context']) ?
            !request.body['@context'].includes('https://www.w3.org/ns/activitystreams') :
            request.body['@context'] !== 'https://www.w3.org/ns/activitystreams')) {
        response.sendStatus(400);
        return;
      }

      const localUserPrefix = `${process.env.ORIGIN}/@`;

      switch (request.body.type) {
      case 'Follow':
        if (typeof request.body.object !== 'string' ||
            !request.body.object.startsWith(localUserPrefix)) {
          response.sendStatus(422);
          return;
        }

        await request.repository.insertFollow(Follow.create(
          request.user,
          await request.repository.selectUserByUsername(
            request.body.object.slice(localUserPrefix.length))));
        break;

      case 'Note':
        await request.repository.insertNote(
          Note.create(request.user, request.body.text));
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
