/*
  Copyright (C) 2018  Miniverse authors

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

import { URLSearchParams } from 'url';
import Actor from '../../../lib/tuples/actor';
import { normalizeHost } from '../../../lib/tuples/uri';
import Context from '.';

const recovery = {};

export async function get({ repository, signal }: Context, params: URLSearchParams) {
  const resource = params.get('resource');
  if (!resource) {
    return null;
  }

  const parsed = /(?:acct:)?(.*)@(.*)/.exec(resource);

  if (!parsed) {
    return null;
  }

  const [, userpart, host] = parsed;
  let actorPromise;

  if (host == normalizeHost(repository.fingerHost)) {
    actorPromise = repository.selectActorByUsernameAndNormalizedHost(
      decodeURI(userpart), null, signal, () => recovery);
  } else {
    actorPromise = Actor.fromUsernameAndNormalizedHost(
      repository,
      decodeURI(userpart),
      host,
      signal,
      () => recovery);
  }

  return actorPromise.then(async actor => {
    if (!actor) {
      return null;
    }

    const account = await actor.select('account', signal, () => recovery);
    if (!account) {
      return null;
    }

    return {
      body: await account.toWebFinger(signal, () => recovery),
      headers: {},
      status: 200
    };
  }).catch(error => {
    if (error == recovery) {
      return { body: null, headers: {}, status: 500 };
    }

    throw error;
  });
}
