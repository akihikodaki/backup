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

import Follow from '../../app/server/models/follow';
import Note from '../../app/server/models/note';

export default async (server, actor, activity) => {
  if (Array.isArray(activity['@context']) ?
        !activity['@context'].includes('https://www.w3.org/ns/activitystreams') :
        activity['@context'] != 'https://www.w3.org/ns/activitystreams') {
    throw new Error;
  }

  switch (activity.type) {
  case 'Follow':
    const follow = await Follow.fromActivityStreams(server, actor, activity);

    if (follow) {
      await server.insertFollow(follow);
    }
    break;

  case 'Note':
    const note = Note.fromActivityStreams(actor, activity);
    const [followers] = await Promise.all([
      server.selectLocalAccountsByFollowee(actor),
      server.insertNote(note)
    ]);

    await server.insertIntoInboxes(followers, note);
    break;
  }
};
