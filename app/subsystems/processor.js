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
import { verifySignature } from 'http-signature';
import Activity from '../../primitives/activity';
import Person from '../../primitives/person';

export default repository => {
  repository.queue.process(globalAgent.maxFreeSockets, async ({ data }) => {
    const { keyId } = data.signature;
    const account = await Person.resolveByKeyId(repository, keyId);

    if (verifySignature(data.signature, account.publicKey.publicKeyPem)) {
      const person = await repository.selectPersonByRemoteAccount(account);
      await Activity.act(repository, person, JSON.parse(data.body));
    }
  });
};
