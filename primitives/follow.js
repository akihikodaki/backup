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

export default class {
  constructor({ actor, actorId, object, objectId }) {
    this.actor = actor;
    this.actorId = actor.id || actorId;
    this.object = object;
    this.objectId = object.id || objectId;
  }

  static async create(repository, actor, object) {
    const follow = new this({ actor, object });
    await repository.insertFollow(follow);
    return follow;
  }

  static async fromActivityStreams(repository, actor, { object }) {
    const localUserPrefix = repository.origin + '/@';

    if (typeof object != 'string' || !object.startsWith(localUserPrefix)) {
      return null;
    }

    const account = await repository.selectLocalAccountByLowerUsername(
      object.slice(localUserPrefix.length).toLowerCase());

    const person = await repository.selectPersonByLocalAccount(account);

    return this.create(repository, actor, person);
  }
};
