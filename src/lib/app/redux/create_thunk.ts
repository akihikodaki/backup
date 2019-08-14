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

import { applyMiddleware } from 'redux';
import State from './state';
import { Ext, Plain } from './types';

export default function(plain: Plain) {
  return applyMiddleware<Ext, State>(api => next => action => {
    if (typeof action == 'function') {
      action(api, plain);
    } else {
      next(action);
    }
  });
}
