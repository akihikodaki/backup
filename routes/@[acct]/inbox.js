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

import { json } from 'express';
import { parseRequest, verifySignature } from 'http-signature';
import act from '../../app/server/act';

const middleware = json({
  type: ['application/activity+json', 'application/ld+json']
});

export function post(request, response, next) {
  const { headers, server } = request;
  headers.authorization = 'Signature ' + headers.signature;
  const signature = parseRequest(request);

  server.selectRemoteAccountByKeyId(signature.keyId).then(account => {
    if (!verifySignature(signature, account.publicKey.publicKeyPem)) {
      return response.sendStatus(401);
    }

    middleware(request, response, () => {
      server.selectPersonByRemoteAccount(account).then(person => {
        return act(server, person, request.body);
      }).then(() => response.sendStatus(201), next);
    });
  }).catch(next);
}
