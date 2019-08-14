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

import { AbortController } from 'abort-controller';
import { parse } from 'cookie';
import { NextFunction, Request } from 'express';
import { digestToken } from '../../lib/tuples/cookie';
import LocalAccount from '../../lib/tuples/local_account';
import { Response } from './types';

const recovery = {};

export default function(request: Request, response: Response, next: NextFunction) {
  const controller = new AbortController;
  const cookie = request.headers.cookie && parse(request.headers.cookie);
  let asyncAccount;

  if (cookie && cookie.miniverse) {
    const digest = digestToken(cookie.miniverse);
    asyncAccount = response.app.locals.repository.selectLocalAccountByDigestOfCookie(
      digest,
      controller.signal,
      () => recovery);
  } else {
    asyncAccount = Promise.resolve(null) as Promise<LocalAccount | null>;
  }

  request.once('aborted', () => controller.abort());
  response.set('Referrer-Policy', 'same-origin');

  asyncAccount.then(async account => {
    if (/^\/bull/i.test(request.path) && !(account && account.admin)) {
      response.sendStatus(403);
    } else {
      response.locals.user = account;
      response.locals.signal = controller.signal;
      next();
    }
  }, error => {
    if (error == recovery) {
      response.sendStatus(422);
    } else {
      next(error);
    }
  });
}
