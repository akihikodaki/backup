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

import Actor from '../../../../lib/tuples/actor';
import { normalizeHost } from '../../../../lib/tuples/uri';
import toActivityStreams from '../to_activitystreams';
import Context, { Response } from '..';
import prefersHtml from '../prefers_html';

const recovery = {};

export async function get(context: Context, acct: string) {
  if (prefersHtml(context)) {
    return null;
  }

  const atIndex = acct.lastIndexOf('@');
  let username;
  let normalizedHost;

  if (atIndex < 0) {
    username = acct;
    normalizedHost = null;
  } else {
    username = acct.slice(0, atIndex);
    normalizedHost = normalizeHost(acct.slice(atIndex + 1));
  }

  return Actor.fromUsernameAndNormalizedHost(
    context.repository,
    username,
    normalizedHost,
    context.signal,
    () => recovery
  ).then<Response>(actor => {
    if (actor) {
      return toActivityStreams(context, actor as any);
    }

    return null;
  }).catch(error => {
    if (error == recovery) {
      return { body: null, headers: {}, status: 422 };
    }

    throw error;
  });
}
