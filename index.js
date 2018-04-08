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
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const { listenTo } = require('./config');
const express = require('express');
const oauth2orize = require('oauth2orize');
const application = express();
const oauth2Server = oauth2orize.createServer();

oauth2Server.exchange(oauth2orize.exchange.password((client, username, password, scope, done) => {
  if (username === 'admin' && password === 'password') {
    done(false, 'accessToken', 'refreshToken');
  }
}));

application.post('/oauth/token',
  express.urlencoded({ extended: false }),
  oauth2Server.token(),
  oauth2Server.errorHandler());

application.use(express.static('dist'));

application.listen(listenTo).on('error', console.error);
