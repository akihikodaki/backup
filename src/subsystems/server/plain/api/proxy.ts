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

import ParsedActivityStreams, {
  noHost
} from '../../../../lib/parsed_activitystreams';
import Actor from '../../../../lib/tuples/actor';
import toActivityStreams from '../to_activitystreams';
import Context, { Response } from '..';

const recovery = {};

export async function postUrlencoded(context: Context, body: {}) {
  const id = (body as any).id as unknown;
  if (typeof id != 'string') {
    throw new Error;
  }

  const parsed = new ParsedActivityStreams(context.repository, id, noHost);

  return Actor.fromParsedActivityStreams(
    context.repository,
    parsed,
    context.signal,
    () => recovery
  ).then<Response>(actor => {
    if (actor) {
      return toActivityStreams(context, actor as any);
    }

    return null;
  }).catch(error => {
    if (error == recovery) {
      return { body: null, headers: {}, status: 500 };
    }

    throw error;
  });
}
