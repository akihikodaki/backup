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

import User from '../../app/server/entities/user';
const express = require('express');

export async function get({ hostname, params, repository }, response) {
  try {
    const user = new User(await repository.selectUserByUsername(params.username));
    const id = `https://${hostname}/@${user.username}`;

    return response.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      id,
      type: 'Person',
      preferredUsername: user.username,
      outbox: id + '/activitypub/outbox'
    });
  } catch (error) {
    console.error(error);
    response.sendStatus(500);
  }
}
