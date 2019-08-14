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

import { Dispatch } from 'redux';
import { Reducible, ReducibleReference, Type } from '../../action';
import State from '../../state';

export default function(
  state: State['page']['note'],
  action: Reducible,
  reference: Dispatch<ReducibleReference>
) {
  switch (action.type) {
  case Type.PageNoteIdLoad:
    return { params: action.params, id: action.id, notFound: false };

  case Type.PageNoteNoteLoad:
    if (!state) {
      throw new Error;
    }

    if (action.note) {
      reference({ type: Type.NotesReference, activityStreams: [action.note] });
      return state;
    }

    return { ...state, notFound: true };

  default:
    return state;
  }
}
