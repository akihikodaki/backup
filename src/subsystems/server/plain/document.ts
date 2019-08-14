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

import Create from '../../../lib/tuples/create';
import toActivityStreams from './to_activitystreams';
import Context, { Response } from '.';

const recovery = {};

export function get(context: Context, uuid: string) {
  return context.repository.selectDocumentByUUID(
    uuid,
    context.signal,
    () => recovery
  ).then<Response>(object => {
    if (!object) {
      return null;
    }

    const create = new Create({ repository: context.repository, object });
    return toActivityStreams(context, create as any);
  }).catch(error => {
    if (error == recovery) {
      return { body: null, headers: {}, status: 500 };
    }

    throw error;
  });
}
