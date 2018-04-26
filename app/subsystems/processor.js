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

import { globalAgent } from 'https';
import ActivityStreams from '../../lib/activitystreams';
import Key from '../../lib/key';
import Person from '../../lib/person';

export default repository => {
  repository.queue.process(globalAgent.maxFreeSockets, async ({ data }) => {
    const { keyId } = data.signature;
    const owner = await Person.resolveByKeyUri(repository, keyId);
    const key = new Key({ owner });

    if (await key.verifySignature(repository, data.signature)) {
      const collection = new ActivityStreams(JSON.parse(data.body));
      const items = await collection.getItems();

      await Promise.all(items.map(item => item.act(repository, owner)));
    }
  });
};
