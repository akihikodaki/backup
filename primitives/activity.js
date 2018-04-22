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

export default {
  async act(repository, actor, activity) {
    if (Array.isArray(activity['@context']) ?
          !activity['@context'].includes('https://www.w3.org/ns/activitystreams') :
          activity['@context'] != 'https://www.w3.org/ns/activitystreams') {
      throw new Error;
    }

    switch (activity.type) {
    case 'Follow':
      await Follow.fromActivityStreams(repository, actor, activity);
      break;

    case 'Note':
      const note = await Note.fromActivityStreams(repository, actor, activity);
      const followers = await repository.selectLocalAccountsByFollowee(actor);

      await repository.insertIntoInboxes(followers, note);
      break;
    }
  }
};
