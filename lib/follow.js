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

import Accept from './accept';
import ActivityStreams from './activitystreams';
import LocalAccount from './local_account';
import RemoteAccount from './remote_account';

export default class {
  constructor(properties) {
    Object.assign(this, properties);
  }

  async selectPersonByActor(repository) {
    await repository.loadPerson(this.actor);
    return this.actor;
  }

  async selectPersonByObject(repository) {
    await repository.loadPerson(this.object);
    return this.object;
  }

  selectRemoteAccountByActor(repository) {
    if (this.actor && this.actor.account) {
      return this.actor.account instanceof RemoteAccount ?
        this.actor.account : null;
    }

    return repository.selectRemoteAccountByPerson(this.actor);
  }

  async toActivityStreams(repository) {
    const [actor, object] = await Promise.all([
      this.selectPersonByActor(repository)
                .then(person => person.getUri(repository)),
      this.selectPersonByObject(repository)
                .then(person => person.getUri(repository))
    ]);

    return new ActivityStreams({ type: 'Follow', actor, object });
  }

  static async create(repository, actor, object) {
    const follow = new this({ actor, object });

    await repository.insertFollow(follow);
    await Accept.create(repository, follow);

    return follow;
  }

  static async fromActivityStreams(repository, actor, { body }) {
    const localUserPrefix = repository.origin + '/@';
    const object = new ActivityStreams(body.object);
    const objectId = object.getId();

    if (!objectId.startsWith(localUserPrefix)) {
      return null;
    }

    const account = await repository.selectLocalAccountByLowerUsername(
      objectId.slice(localUserPrefix.length).toLowerCase());

    const person = await account.selectPerson(repository);

    return this.create(repository, actor, person);
  }
};
