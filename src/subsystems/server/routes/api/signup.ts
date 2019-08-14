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

import { NextFunction, Request } from 'express';
import { raw } from 'body-parser';
import LocalAccount from '../../../../lib/tuples/local_account';
import { Response } from '../../types';
import cookie from './cookie';

const recovery = {};
const setBody = raw();

export function post(request: Request, response: Response, next: NextFunction) {
  setBody(request, response, error => {
    if (error) {
      next(error);
      return;
    }

    const { body } = request;
    const { repository } = response.app.locals;
    const salt = body.slice(0, 64);
    const serverKey = body.slice(64, 96);
    const storedKey = body.slice(96, 128);
    const username = body.slice(128).toString();

    LocalAccount.create(repository, {
      actor: {
        username,
        name: '',
        summary: ''
      },
      admin: false,
      salt,
      serverKey,
      storedKey
    }, response.locals.signal, k => { console.log(k); return recovery; }).then(
      account => cookie(repository, account, response)
    ).then(() => response.sendStatus(204), error => {
      if (error == recovery) {
        response.sendStatus(422);
      } else {
        next(error);
      }
    });
  });
}
