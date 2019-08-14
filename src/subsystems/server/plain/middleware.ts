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

import { NextFunction, Request, json, urlencoded } from 'express';
import Plain, { Response as PlainResponse } from '.';
import { Response } from '../types';

/*
  ActivityPub
  6. Client to Server Interactions
  https://www.w3.org/TR/activitypub/#client-to-server-interactions
  > Servers MAY interpret a Content-Type or Accept header of
  > application/activity+json as equivalent to
  > application/ld+json; profile="https://www.w3.org/ns/activitystreams"
  > for client-to-server interactions.
*/
const setJSONBody = json({
  type: [
    'application/activity+json',
    'application/json',
    'application/ld+json'
  ]
});

const setUrlencodedBody = urlencoded({ extended: false });

function createPlain({ headers }: Request, { app, locals }: Response) {
  return new Plain(app.locals.repository, locals.signal, headers, locals.user);
}

function servePlain(
  plain: Promise<PlainResponse>,
  response: Response,
  next: NextFunction
) {
  plain.then(resolved => {
    if (resolved) {
      response.set(resolved.headers);
      if (resolved.body) {
        response.status(resolved.status);
        response.send(resolved.body);
      } else {
        response.sendStatus(resolved.status);
      }
    } else {
      next();
    }
  }, next);
}

export default function(
  request: Request,
  response: Response,
  next: NextFunction
) {
  let plain;

  switch (request.method) {
  case 'GET':
    plain = createPlain(request, response);
    servePlain(plain.get(request.url), response, next);
    break;

  case 'POST':
    setJSONBody(request, response, error => {
      if (error) {
        next(error);
      } else if (Object.keys(request.body).length > 0) {
        plain = createPlain(request, response);
        servePlain(plain.postJSON(request.url, request.body), response, next);
      } else {
        setUrlencodedBody(request, response, error => {
          if (error) {
            next(error);
          } else if (Object.keys(request.body).length > 0) {
            plain = createPlain(request, response);

            servePlain(
              plain.postUrlencoded(request.url, request.body),
              response,
              next);
          } else {
            next();
          }
        });
      }
    });
    break;

  default:
    next();
  }
}
