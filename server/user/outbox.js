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

const express = require('express');
const Note = require('../entities/note');
const oauthOwner = require('../oauth/owner');

module.exports = (repositories) => {
  const application = express();

  application.post('/@:username/activitypub/outbox', oauthOwner(repositories), express.json({
    type: ['application/activity+json', 'application/ld+json']
  }), async ({ body, params, user }, response) => {
    try {
      if (params.username !== user.username) {
        response.sendStatus(401);
        return;
      }

      if ((Array.isArray(body['@context']) ?
            !body['@context'].includes('https://www.w3.org/ns/activitystreams') :
            body['@context'] !== 'https://www.w3.org/ns/activitystreams') ||
          body.type !== 'Note') {
        response.sendStatus(400);
        return;
      }

      await repositories.notes.insert(Note.create(user, body.text));
    } catch (error) {
      console.error(error);
      response.sendStatus(500);
      return;
    }

    response.sendStatus(201);
  });

  return application;
};
