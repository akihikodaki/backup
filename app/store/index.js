/*
  Copyright (C) 2018  Akihiko Odaki <nekomanma@pixiv.co.jp>

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

import { Store as Base } from 'svelte/store';
import createNotes from './notes';
import createPersons from './persons';
import createSession from './session';
import createStreaming from './streaming';

class Store extends Base {}

createNotes.call(Store.prototype);
createPersons.call(Store.prototype);
createSession.call(Store.prototype);
createStreaming.call(Store.prototype);

export default Store;
