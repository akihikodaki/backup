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
  anyHost,
  unexpectedType
} from '../../../../lib/parsed_activitystreams';
import { create } from '../../../../lib/tuples/create';
import OrderedCollection from '../../../../lib/tuples/ordered_collection';
import { normalizeHost } from '../../../../lib/tuples/uri';
import toActivityStreams from '../to_activitystreams';
import Context from '..';

const abort = {};
const fallback = {};

export async function get(context: Context, acct: string) {
  const [userpart, host] = acct.split('@', 2);
  let orderedItems;

  return context.repository.selectActorByUsernameAndNormalizedHost(
    userpart,
    host ? normalizeHost(host) : null,
    context.signal,
    () => abort
  ).then(async actor => {
    if (!actor) {
      return { body: null, headers: {}, status: 403 };
    }

    const statuses =
      await actor.select('statuses', context.signal, () => abort);

    orderedItems = (await Promise.all(statuses.map(status =>
      status.select('extension', context.signal, () => abort)
    ))).filter(Boolean as unknown as <T>(value: T | null) => value is T);

    /*
      ActivityPub
      5.1 Outbox
      https://www.w3.org/TR/activitypub/#outbox
      > The outbox MUST be an OrderedCollection.
    */
    const collection = new OrderedCollection({ orderedItems });

    return toActivityStreams(context, collection as any);
  }).catch(error => {
    if (error == abort) {
      return { body: null, headers: {}, status: 422 };
    }

    throw error;
  });
}

/*
  ActivityPub
  5.1 Outbox
  https://www.w3.org/TR/activitypub/#outbox
  > The outbox accepts HTTP POST requests, with behaviour described in Client
  > to Server Interactions.
*/
export async function postJSON(
  { headers, repository, signal, user }: Context,
  acct: string,
  body: any
) {
  const { origin } = headers;
  if (typeof origin != 'string') {
    return { body: null, headers: {}, status: 403 };
  }

  if (origin.toLowerCase() != 'https://' + normalizeHost(repository.host)) {
    return { body: null, headers: {}, status: 403 };
  }

  if (!user) {
    return { body: null, headers: {}, status: 403 };
  }

  return user.select('actor', signal, () => abort).then(async actor => {
    if (!actor) {
      return { body: null, headers: {}, status: 403 };
    }

    if (actor.username != acct) {
      return { body: null, headers: {}, status: 403 };
    }

    const object = new ParsedActivityStreams(repository, body, anyHost);

    /*
      ActivityPub
      6. Client to Server Interactions
      https://www.w3.org/TR/activitypub/#client-to-server-interactions
      > The body of the POST request MUST contain a single Activity (which MAY
      > contain embedded objects), or a single non-Activity object which will
      > be wrapped in a Create activity by the server.
    */
    const result = await object.act(
      actor,
      signal,
      error => error[unexpectedType] ? fallback : abort
    ).catch(async error => {
      if (error != fallback) {
        throw error;
      }

      const created = await create(
        repository,
        actor,
        object,
        signal,
        () => abort);
      if (!created) {
        return null;
      }

      const status = await created.select('status', signal, () => abort);
      if (!status) {
        return null;
      }

      return status.getUri(signal, () => abort);
    });

    /*
      ActivityPub
      6. Client to Server Interactions
      https://www.w3.org/TR/activitypub/#client-to-server-interactions
      > Servers MUST return a 201 Created HTTP code, and unless the
      > activity is transient, MUST include the new id in the Location
      > header.
    */
    return {
      body: null,
      headers: result ? { Location: result } : {},
      status: 201
    };
  }).catch(error => {
    if (error == abort) {
      return { body: null, headers: {}, status: 422 };
    }

    throw error;
  });
}
