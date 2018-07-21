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

import { Temporary as TemporaryError } from './errors';
import {
  fabricateFollow,
  fabricateLocalAccount,
  fabricateNote,
  fabricateRemoteAccount
} from './test/fabricator';
import repository from './test/repository';
import { unwrap } from './test/types';
import { fetch, postStatus, postToInbox } from './transfer';

const nock = require('nock');

describe('fetch', () => {
  test('assigns User-Agent header if the second argument is not present',
    () => {
      nock('https://ReMoTe.إختبار')
        .matchHeader('User-Agent', 'Miniverse (origin.example.com)')
        .get('/')
        .reply(200);

      return fetch(repository, 'https://ReMoTe.إختبار/').then(
        () => expect(nock.isDone()).toBe(true), nock.cleanAll.bind(nock));
    });

  test('assigns User-Agent header and given headers if the second argument is present', () => {
    nock('https://ReMoTe.إختبار')
      .matchHeader('Accept', 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"')
      .matchHeader('User-Agent', 'Miniverse (origin.example.com)')
      .get('/')
      .reply(200);

    return fetch(repository, 'https://ReMoTe.إختبار/', {
      headers: { Accept: 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"' }
    }).then(() => expect(nock.isDone()).toBe(true), nock.cleanAll.bind(nock));
  });

  for (const code of [429, 500, 502, 503, 504]) {
    test(`rejects with TemporaryError if status code is ${code}`, async () => {
      nock('https://ReMoTe.إختبار').get('/').reply(code);

      try {
        await expect(fetch(repository, 'https://ReMoTe.إختبار/'))
         .rejects
         .toBeInstanceOf(TemporaryError);
      } finally {
        nock.cleanAll();
      }
    });
  }

  test('rejects with non-temporary error if status code is 400', async () => {
    nock('https://ReMoTe.إختبار').get('/').reply(400);

    try {
      const promise = fetch(repository, 'https://ReMoTe.إختبار/');

      await expect(promise).rejects.toBeInstanceOf(Error);
      await expect(promise).rejects.not.toBeInstanceOf(TemporaryError);
    } finally {
      nock.cleanAll();
    }
  });

  test('rejects with TemporaryError in case of network error', async () => {
    nock('https://ReMoTe.إختبار').get('/').replyWithError('');

    try {
      await expect(fetch(repository, 'https://ReMoTe.إختبار/'))
       .rejects
       .toBeInstanceOf(TemporaryError);
    } finally {
      nock.cleanAll();
    }
  });
});

describe('postStatus', () => {
  test('inserts into inboxes of local followers', async () => {
    const actorAccount = await fabricateLocalAccount();
    const actor = unwrap(await actorAccount.select('actor'));
    const follow = await fabricateFollow({ actor });
    const object = unwrap(await follow.select('object'));

    const note = await fabricateNote({
      status: { actor: object },
      content: '内容'
    });

    await postStatus(repository, unwrap(await note.select('status')));

    expect((await actorAccount.select('inbox'))[0])
      .toHaveProperty(['extension', 'content'], '内容');
  });

  test('does not insert into local inboxes of remote followers', async () => {
    const actorAccount = await fabricateRemoteAccount();
    const actor = unwrap(await actorAccount.select('actor'));
    const follow = await fabricateFollow({ actor });
    const object = unwrap(await follow.select('object'));
    const note = await fabricateNote({ status: { actor: object } });

    await postStatus(repository, unwrap(await note.select('status')));

    await expect(repository.selectRecentStatusesIncludingExtensionsAndActorsFromInbox(unwrap(actorAccount.id)))
      .resolves
      .toHaveProperty('length', 0);
  });

  test('posts note to inboxes of remote followers', async () => {
    const actorAccount = await fabricateRemoteAccount();
    const actor = unwrap(await actorAccount.select('actor'));
    const follow = await fabricateFollow({ actor });
    const object = unwrap(await follow.select('object'));
    const note = await fabricateNote({ status: { actor: object } });

    await postStatus(repository, unwrap(await note.select('status')));

    await expect((await repository.queue.getWaiting())[0])
      .toHaveProperty(['data', 'type'], 'postStatus')
  });

  test('deduplicates remote inboxes', async () => {
    const actors = [];

    for (let index = 0; index < 2; index++) {
      const { actor } = await fabricateRemoteAccount({ inboxURI: { uri: '' } });
      actors[index] = actor;
    }

    const objectAccount = await fabricateLocalAccount();
    const object = unwrap(await objectAccount.select('actor'));

    await Promise.all(actors.map(actor => fabricateFollow({ actor, object })));

    const note = await fabricateNote({ status: { actor: object } });
    await postStatus(repository, unwrap(await note.select('status')));

    await expect(repository.queue.getWaiting())
      .resolves
      .toHaveProperty('length', 1);
  });

  test('does not post note to inboxes of remote followers if note is remote',
    async () => {
      const [actor, object] = await Promise.all([
        fabricateRemoteAccount()
          .then(account => account.select('actor'))
          .then(unwrap),
        fabricateRemoteAccount()
          .then(account => account.select('actor'))
          .then(unwrap)
      ]);

      await fabricateFollow({ actor, object });

      const note = await fabricateNote({ status: { actor: object } });
      await postStatus(repository, unwrap(await note.select('status')));

      await expect(repository.queue.getWaiting())
        .resolves
        .toHaveProperty('length', 0);
    });
});

describe('postToInbox', () => {
  async function post() {
    const [sender, inboxURI] = await Promise.all([
      fabricateLocalAccount({ actor: { username: 'SeNdEr' } }),
      fabricateRemoteAccount(
        { inboxURI: { uri: 'https://ReCiPiEnT.إختبار/?inbox' } })
          .then(recipient => recipient.select('inboxURI'))
          .then(unwrap)
    ]);

    return postToInbox(repository, sender, inboxURI, {
      async toActivityStreams() {
        return {
          type: 'Announce',
          id: 'https://Id.إختبار/',
          published: new Date('2000-01-01T00:00:00.000Z'),
          object: 'https://ObJeCt.إختبار/'
        };
      },
    });
  }

  test('delivers to remote account', async () => {
    /*
      ActivityPub
      7. Server to Server Interactions
      https://www.w3.org/TR/activitypub/#server-to-server-interactions
      > POST requests (eg. to the inbox) MUST be made with a Content-Type of
      > application/ld+json; profile="https://www.w3.org/ns/activitystreams"

      Mastodon requires HTTP signature:
      HTTP signatures (#4146) · tootsuite/mastodon@1618b68
      https://github.com/tootsuite/mastodon/commit/1618b68bfa740ed655ac45d7d5f4f46fed6c8c62#diff-5b3d0ae6b9258cbe471d5b2a3a1646a6

      reqheaders ignored · Issue #748 · node-nock/nock
      https://github.com/node-nock/nock/issues/748
    */
    const nockPost = nock('https://ReCiPiEnT.إختبار')
      .matchHeader('Content-Type', 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"')
      .matchHeader('Signature', /keyId="https:\/\/xn--kgbechtv\/@SeNdEr#key",algorithm="rsa-sha256",headers="date",signature=".*"/)
      .post('/?inbox', {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Announce',
        id: 'https://Id.إختبار/',
        published: '2000-01-01T00:00:00.000Z',
        object: 'https://ObJeCt.إختبار/'
      })
      .reply(200);

    try {
      await post();
      expect(nockPost.isDone()).toBe(true);
    } finally {
      nock.cleanAll();
    }
  });

  test('rejects if failed to deliver to remote object', async () => {
    const nockPost = nock('https://ReCiPiEnT.إختبار')
      .post('/?inbox')
      .replyWithError('');

    try {
      await expect(post()).rejects.toBeInstanceOf(Error);
      expect(nockPost.isDone());
    } finally {
      nock.cleanAll();
    }
  });

  test('resolves even if response has body', async () => {
    const nockPost = nock('https://ReCiPiEnT.إختبار')
      .post('/?inbox')
      .reply(200, 'body');

    try {
      await post();
      expect(nockPost.isDone()).toBe(true);
    } finally {
      nock.cleanAll();
    }
  });
});