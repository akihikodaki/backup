<!--
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
-->
<h1>{{$sessionUsername}}</h1>
<form on:submit='post(event)'>
  <textarea name='text' />
  <button>Post</button>
</form>
<script>
  export default {
    oncreate() {
      this.store.stream();
    },

    methods: {
      post(event) {
        const { outbox } = this.store.get('persons')[this.store.get('sessionUsername')];

        event.preventDefault();

        return this.store.fetchAuthorized('POST', outbox, instance => {
          instance.setRequestHeader('Content-Type', 'application/activity+json');
          instance.send(JSON.stringify({
            '@context': 'https://www.w3.org/ns/activitystreams',
            type: 'Note',
            text: event.target.elements.text.value,
          }));
        });
      }
    }
  };
</script>
