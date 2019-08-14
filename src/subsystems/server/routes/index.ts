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

import { Router } from 'express';
import { post as postAcctInbox } from './acct/inbox';
import { get as getApiEvents } from './api/events';
import { post as postApiSignin } from './api/signin';
import { post as postApiSignup } from './api/signup';
import { post as postApiUploadMedia } from './api/upload_media';

export default function() {
  const router = Router();

  router.post('/@:acct/inbox', postAcctInbox);
  router.get('/api/events', getApiEvents);
  router.post('/api/signin', postApiSignin);
  router.post('/api/signup', postApiSignup);
  router.post('/api/uploadMedia', postApiUploadMedia);

  return router;
}
