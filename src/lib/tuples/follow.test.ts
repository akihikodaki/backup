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

import { AbortController } from 'abort-controller';
import ParsedActivityStreams, { anyHost } from '../parsed_activitystreams';
import {
  fabricateFollow,
  fabricateLocalAccount,
  fabricateRemoteAccount
} from '../test/fabricator';
import repository from '../test/repository';
import { unwrap } from '../test/types';
import Actor from './actor';
import Follow, { unexpectedType } from './follow';

const { signal } = new AbortController;

describe('toActivityStreams', () => {
  test('returns ActivityStreams representation', async () => {
    const recover = jest.fn();

    const [actor, object] = await Promise.all([
      fabricateLocalAccount({ actor: { username: '行動者' } })
        .then(account => account.select('actor', signal, recover))
        .then(unwrap),
      fabricateLocalAccount({ actor: { username: '被行動者'} })
        .then(account => account.select('actor', signal, recover))
        .then(unwrap)
    ]);

    const follow = await fabricateFollow({ actor, object });

    await expect(follow.toActivityStreams(signal, recover))
      .resolves
      .toEqual({
        type: 'Follow',
        actor: 'https://xn--kgbechtv/@%E8%A1%8C%E5%8B%95%E8%80%85',
        object: 'https://xn--kgbechtv/@%E8%A2%AB%E8%A1%8C%E5%8B%95%E8%80%85'
      });

    expect(recover).not.toHaveBeenCalled();
  });
});

describe('create', () => {
  test('creates follow', async () => {
    const recover = jest.fn();

    const [actor, object] = await Promise.all([
      fabricateLocalAccount()
        .then(account => account.select('actor', signal, recover))
        .then(unwrap),
      fabricateLocalAccount()
        .then(account => account.select('actor', signal, recover))
        .then(unwrap)
    ]);

    const follow = await fabricateFollow({ actor, object });
    const followees =
      await repository.selectActorsByFolloweeId(object.id, signal, recover);

    expect(recover).not.toHaveBeenCalled();
    expect(follow).toBeInstanceOf(Follow);
    expect(follow).toHaveProperty('repository', repository);
    expect(follow).toHaveProperty('actor', actor);
    expect(follow).toHaveProperty('object', object);
    expect(followees[0]).toBeInstanceOf(Actor);
  });

  /*
    ActivityPub
    6.5 Follow Activity
    https://www.w3.org/TR/activitypub/#follow-activity-outbox
    > The side effect of receiving this in an outbox is that the server SHOULD
    > add the object to the actor's following Collection when and only if an
    > Accept activity is subsequently received with this Follow activity as its
    > object.
  */
  test('creates accept activity', async () => {
    const recover = jest.fn();
    const [actor, object] = await Promise.all([
      fabricateRemoteAccount()
        .then(account => account.select('actor', signal, recover))
        .then(unwrap),
      fabricateLocalAccount({ actor: { username: '被行動者' } })
        .then(account => account.select('actor', signal, recover))
        .then(unwrap)
    ]);

    await Follow.create(repository, { actor, object }, signal, recover);

    expect(recover).not.toHaveBeenCalled();
    await expect((await repository.queue.getWaiting())[0])
      .toHaveProperty(['data', 'type'], 'accept');
  });
});

describe('createFromParsedActivityStreams', () => {
  const { signal } = new AbortController;

  test('creates follow from ActivityStreams representation', async () => {
    const recover = jest.fn();

    const [actor, object] = await Promise.all([
      fabricateRemoteAccount()
        .then(account => account.select('actor', signal, recover))
        .then(unwrap),
      fabricateLocalAccount({ actor: { username: '被行動者' } })
        .then(account => account.select('actor', signal, recover))
        .then(unwrap)
    ]);

    const activity = new ParsedActivityStreams(repository, {
      type: 'Follow',

      // See if it accepts IDNA-encoded domain and percent-encoded path.
      object: 'https://xn--kgbechtv/@%E8%A2%AB%E8%A1%8C%E5%8B%95%E8%80%85'
    }, anyHost);

    const follow = await Follow.createFromParsedActivityStreams(
      repository, activity, actor, signal, recover);

    expect(follow).toHaveProperty('actor', actor);

    await expect(follow.select('object', signal, recover))
      .resolves
      .toHaveProperty('id', object.id);

    expect(recover).not.toHaveBeenCalled();
  });

  test('creates follow from ActivityStreams representation given uppercase username', async () => {
    const recover = jest.fn();

    const [actor, object] = await Promise.all([
      fabricateRemoteAccount()
        .then(account => account.select('actor', signal, recover))
        .then(unwrap),
      fabricateLocalAccount({ actor: { username: 'OBJECT' } })
        .then(account => account.select('actor', signal, recover))
        .then(unwrap)
    ]);

    const activity = new ParsedActivityStreams(repository, {
      type: 'Follow',
      object: 'https://xn--kgbechtv/@OBJECT'
    }, anyHost);

    const follow = await Follow.createFromParsedActivityStreams(
      repository, activity, actor, signal, recover);

    expect(follow).toHaveProperty('actor', actor);

    await expect(follow.select('object', signal, recover))
      .resolves
      .toHaveProperty('id', object.id);

    expect(recover).not.toHaveBeenCalled();
  });

  test('rejects if type is not Follow', async () => {
    const [actor] = await Promise.all([
      fabricateRemoteAccount(),
      fabricateLocalAccount({ actor: { username: 'OBJECT' } })
    ]);

    const activity = new ParsedActivityStreams(repository, {
      object: 'https://xn--kgbechtv/@OBJECT'
    }, anyHost);

    const recover = jest.fn();

    const actorActor = unwrap(await actor.select('actor', signal, recover));
    const recovery = {};

    expect(recover).not.toHaveBeenCalled();

    await expect(Follow.createFromParsedActivityStreams(
      repository, activity, actorActor, signal, error => {
        expect(error[unexpectedType]).toBe(true);
        return recovery;
      })).rejects.toBe(recovery);
  });

  test('posts to remote inbox', async () => {
    const recover = jest.fn();

    const [actor] = await Promise.all([
      fabricateLocalAccount()
        .then(account => account.select('actor', signal, recover))
        .then(unwrap),
      fabricateRemoteAccount(
        { uri: 'https://ObJeCt.إختبار/' })
    ]);

    const activity = new ParsedActivityStreams(repository, {
      type: 'Follow',
      object: 'https://ObJeCt.إختبار/'
    }, anyHost);

    await expect(Follow.createFromParsedActivityStreams(
      repository, activity, actor, signal, recover)).resolves.toBeInstanceOf(Follow);

    expect(recover).not.toHaveBeenCalled();
    await expect((await repository.queue.getWaiting())[0])
      .toHaveProperty(['data', 'type'], 'postFollow');
  });
});
