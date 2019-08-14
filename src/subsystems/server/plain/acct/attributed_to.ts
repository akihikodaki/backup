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

import { normalizeHost } from '../../../../lib/tuples/uri';
import toActivityStreams from '../to_activitystreams';
import Context from '..';
import prefersHtml from '../prefers_html';

const recovery = {};

export async function get(context: Context, acct: string, id: string) {
  if (prefersHtml(context)) {
    return null;
  }

  const atIndex = acct.lastIndexOf('@');
  let extension;
  let actor;
  let username: string;
  let normalizedHost: null | string;

  if (atIndex < 0) {
    username = acct;
    normalizedHost = null;
  } else {
    username = acct.slice(0, atIndex);
    normalizedHost = normalizeHost(acct.slice(atIndex + 1));
  }

  return context.repository.selectStatusIncludingExtensionById(
    id,
    context.signal,
    () => recovery
  ).then(async status => {
    if (!status) {
      return null;
    }

    [extension, actor] = await Promise.all([
      status.select('extension', context.signal, () => recovery),
      status.select('actor', context.signal, () => recovery)
    ]);
    if (!extension || !actor || actor.username != username || (
      actor.host != normalizedHost &&
      actor.host &&
      normalizeHost(actor.host) != normalizedHost
    )) {
      return null;
    }

    return toActivityStreams(context, extension as any);
  }).catch(error => {
    if (error == recovery) {
      return { body: null, headers: {}, status: 422 };
    }

    throw error;
  });
}
