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
import { generateAcct } from '../../../generated_activitystreams';
import { Reducible, ReducibleReference, Type } from '../action';
import State from '../state';

export default function(
  state: State['session'],
  action: Reducible,
  reference: Dispatch<ReducibleReference>
) {
  if (action.type == Type.SignIn) {
    if (state.user) {
      reference({ type: Type.ActorsDereference, accts: [state.user] });
    }

    reference({
      type: Type.ActorsReference,
      actors: [action.activityStreams]
    });

    return { ...state, user: generateAcct(action.activityStreams) };
  }
  
  return state;
}
