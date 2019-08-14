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

import { AbortSignal } from 'abort-controller';
import { Plain as ReduxPlain } from '../../../lib/app/redux/types';
import Repository from '../../../lib/repository';
import LocalAccount from '../../../lib/tuples/local_account';
import Plain from '.';

/*
  ECMAScript® 2018 Language Specification
  24.5.2 JSON.stringify ( value [ , replacer [ , space ] ] )
  https://www.ecma-international.org/ecma-262/9.0/index.html#sec-json.stringify
  > Return ? SerializeJSONProperty(the empty String, wrapper).

  24.5.2.1 Runtime Semantics: SerializeJSONProperty ( key, holder )
  https://www.ecma-international.org/ecma-262/9.0/index.html#sec-serializejsonproperty
  > If Type(value) is Object, then
  >    Let toJSON be ? Get(value, "toJSON").
  >    If IsCallable(toJSON) is true, then
  >        Set value to ? Call(toJSON, value, « key »).
*/

function toJSON(key: string, o: any) {
  if (!o || typeof o != 'object') {
    return o;
  }

  if (typeof o.toJSON == 'function') {
    return o.toJSON(key);
  }

  for (const [key, value] of Object.entries(o)) {
    o[key] = toJSON(key, value);
  }

  return o;
}

export default function(
  repository: Repository,
  signal: AbortSignal,
  user: LocalAccount | null
): ReduxPlain {
  return {
    async get(headers, url) {
      const plain = new Plain(repository, signal, headers, user);
      return toJSON('', await plain.get(url));
    },

    async postJSON(headers, url, body) {
      const plain = new Plain(repository, signal, headers, user);
      return toJSON('', await plain.postJSON(url, body));
    },

    async postUrlencoded(headers, url, body) {
      const plain = new Plain(repository, signal, headers, user);
      return toJSON('', await plain.postUrlencoded(url, body));
    }
  };
}
