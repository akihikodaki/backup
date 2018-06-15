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

import { raw } from 'body-parser';
import { URLSearchParams } from 'url';
import fetch from '../../lib/fetch';
import LocalAccount from '../../lib/local_account';
import cookie from './_cookie';

const middleware = raw();

export function post(request, response, next) {
  middleware(request, response, error => {
    if (error) {
      next(error);
      return;
    }

    const { body, repository } = request;
    const salt = body.slice(0, 64);
    const serverKey = body.slice(64, 96);
    const storedKey = body.slice(96, 128);
    const [token, username] = body.slice(128).toString().split('\0');
    const verification = repository.captcha.verifier ?
      fetch(repository, repository.captcha.verifier, {
        method: 'POST',
        body: new URLSearchParams(
          { secret: repository.captcha.secret, token, hashes: '1024' })
      }).then(verification => verification.json())
        .then(({ success }) => success) :
      Promise.resolve(true);

    verification.then(async success => {
      if (!success) {
        response.sendStatus(401);
        return;
      }

      const account = await LocalAccount.create(
        repository, username, false, salt, serverKey, storedKey);

      cookie(repository, account, response);
      response.sendStatus(204);
    }).catch(next);
  });
}
