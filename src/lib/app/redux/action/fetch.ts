/*
  Copyright (C) 2019  Miniverse authors

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

import {
  Actor,
  Announce,
  Note,
  OrderedCollection
} from '../../../generated_activitystreams';
import { Account } from '../../../generated_webfinger';
import { Plain } from '../types';
import State from '../state';

const headers = {
  accept: 'application/activity+json;q=0.9,application/ld+json;q=0.8'
};

export async function fetchActor({ session }: State, { get, postUrlencoded }: Plain, acct: string) {
  const finger = await get(
    {},
    `https://${session.host}/.well-known/webfinger?resource=acct:${encodeURIComponent(acct)}`);
  if (!finger || [404, 410].includes(finger.status)) {
    return null;
  }

  const { links } = finger.body as Account;
  const link = links.find(({ rel }) => rel == 'self');
  if (!link) {
    return null;
  }

  const activityStreams = await postUrlencoded(
    headers, session.endpoints.proxyUrl, { id: link.href });

  return !activityStreams || [404, 410].includes(activityStreams.status) ?
    null : activityStreams.body as Actor;
}

export async function fetchStatus({ get }: Plain, id: string) {
  const activityStreams = await get(headers, id);

  return !activityStreams || [404, 410].includes(activityStreams.status) ?
    null : activityStreams.body as Announce | Note;
}

export async function fetchOutbox(actor: Readonly<Actor>, { get }: Plain): Promise<OrderedCollection | null> {
  const fetched = await get(headers, actor.outbox);
  if (!fetched || [404, 410].includes(fetched.status)) {
    return null;
  }

  return fetched.body as OrderedCollection;
}
