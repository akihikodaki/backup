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

import { mediaType } from '@hapi/accept';
import Context from '.';

export default function({ headers: { accept } }: Context) {
  if (typeof accept != 'string') {
    return true;
  }

  /*
    ActivityPub
    https://www.w3.org/TR/activitypub/
    > Servers MAY use HTTP content negotiation as defined in [RFC7231] to select
    > the type of data to return in response to a request, but MUST present the
    > ActivityStreams object representation in response to
    > application/ld+json; profile="https://www.w3.org/ns/activitystreams",
    > and SHOULD also present the ActivityStreams representation in response to
    > application/activity+json as well.
  */
  const accepted = mediaType(accept, [
    'text/html',
    'application/activity+json',
    'application/ld+json'
  ]);

  return !accepted || accepted.startsWith('text/html');
}
