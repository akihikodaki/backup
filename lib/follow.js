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

    return { type: 'Follow', actor, object };
  }

  static async create(repository, actor, object) {
    const follow = new this({ actor, object });

    await repository.insertFollow(follow);
    await Accept.create(repository, follow);

    return follow;
  }

  static async fromActivityStreams(repository, actor, { object }) {
    const localUserPrefix = repository.origin + '/@';

    if (typeof object != 'string' || !object.startsWith(localUserPrefix)) {
      return null;
    }

    const account = await repository.selectLocalAccountByLowerUsername(
      object.slice(localUserPrefix.length).toLowerCase());

    const person = await account.selectPerson(repository);

    return this.create(repository, actor, person);
  }
};
