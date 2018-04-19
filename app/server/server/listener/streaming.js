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

import { URLSearchParams } from 'url';
import { Server as WebSocketServer } from 'ws';
import OrderedCollection from '../../models/ordered_collection';
import { authenticate, parseAuthorization } from '../../oauth/owner';

export default function(server) {
  const webSocketServer = new WebSocketServer({
    path: '/api/streaming',
    server,
    verifyClient: ({ req }, done) => {
      const token =
        parseAuthorization(req) ||
          new URLSearchParams(/\?.*/.exec(req.url)[0]).get('access_token');

      authenticate(this, token).then(user => {
        req.user = user;
        done(user);
      }, error => {
        this.console.error(error);
        done()
      });
    },
  });

  webSocketServer.on('connection', (connection, { user }) => {
    this.selectRecentNotesFromInbox(user).then(async notes => {
      const initialCollection = new OrderedCollection({
        orderedItems: notes.reverse()
      });

      const initialActivityStreams = initialCollection.toActivityStreams(this);
      const subscribedChannel = this.getInboxChannel(user);

      initialActivityStreams['@context'] = 'https://www.w3.org/ns/activitystreams';
      connection.send(JSON.stringify(initialActivityStreams));

      await this.subscribe(subscribedChannel, (publishedChannel, message) => {
        connection.send(`{"@context":"https://www.w3.org/ns/activitystreams","type":"OrderedCollection","orderedItems":[${message}]}`);
      });

      connection.on('close', () => this.unsubscribe(subscribedChannel));
    });
  });
}
