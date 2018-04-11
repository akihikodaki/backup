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

export default store => {
  let socket;

  store.subscribe(() => {
    if ((socket == null) == store.getState().streaming.opening) {
      return;
    }

    if (socket) {
      socket.close();
    } else {
      socket = new WebSocket(`wss://${location.host}/api/v0/streaming`);
      socket.onmessage = console.log;
    }
  });
};
