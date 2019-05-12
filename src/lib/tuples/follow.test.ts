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

import ParsedActivityStreams, {
  AnyHost,
  TypeNotAllowed
} from '../parsed_activitystreams';
import {
  fabricateFollow,
  fabricateLocalAccount,
  fabricateRemoteAccount
} from '../test/fabricator';
import repository from '../test/repository';
import { unwrap } from '../test/types';
import Actor from './actor';
import Follow from './follow';

describe('toActivityStreams', () => {
  test('returns ActivityStreams representation', async () => {
    const [actor, object] = await Promise.all([
      fabricateLocalAccount({ actor: { username: '行動者' } })
        .then(account => account.select('actor'))
        .then(unwrap),
      fabricateLocalAccount({ actor: { username: '被行動者'} })
        .then(account => account.select('actor'))
        .then(unwrap)
    ]);

    const follow = await fabricateFollow({ actor, object });

    await expect(follow.toActivityStreams())
      .resolves
      .toEqual({
        type: 'Follow',
        actor: 'https://xn--kgbechtv/@%E8%A1%8C%E5%8B%95%E8%80%85',
        object: 'https://xn--kgbechtv/@%E8%A2%AB%E8%A1%8C%E5%8B%95%E8%80%85'
      });
  });
});

describe('create', () => {
  test('creates follow', async () => {
    const [actor, object] = await Promise.all([
      fabricateLocalAccount()
        .then(account => account.select('actor'))
        .then(unwrap),
      fabricateLocalAccount()
        .then(account => account.select('actor'))
        .then(unwrap)
    ]);

    const follow = await fabricateFollow({ actor, object });

    expect(follow).toBeInstanceOf(Follow);
    expect(follow).toHaveProperty('repository', repository);
    expect(follow).toHaveProperty('actor', actor);
    expect(follow).toHaveProperty('object', object);
    expect((await repository.selectActorsByFolloweeId(unwrap(object.id)))[0])
      .toBeInstanceOf(Actor);
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
    const [actor, object] = await Promise.all([
      fabricateRemoteAccount()
        .then(account => account.select('actor'))
        .then(unwrap),
      fabricateLocalAccount({ actor: { username: '被行動者' } })
        .then(account => account.select('actor'))
        .then(unwrap)
    ]);

    await Follow.create(repository, actor, object);

    await expect((await repository.queue.getWaiting())[0])
      .toHaveProperty(['data', 'type'], 'accept');
  });
});

describe('createFromParsedActivityStreams', () => {
  test('creates follow from ActivityStreams representation', async () => {
    const [actor, object] = await Promise.all([
      fabricateRemoteAccount()
        .then(account => account.select('actor'))
        .then(unwrap),
      fabricateLocalAccount({ actor: { username: '被行動者' } })
        .then(account => account.select('actor'))
        .then(unwrap)
    ]);

    const activity = new ParsedActivityStreams(repository, {
      type: 'Follow',

      // See if it accepts IDNA-encoded domain and percent-encoded path.
      object: 'https://xn--kgbechtv/@%E8%A2%AB%E8%A1%8C%E5%8B%95%E8%80%85'
    }, AnyHost);

    const follow = await Follow.createFromParsedActivityStreams(
      repository, activity, actor);

    expect(follow).toHaveProperty('actor', actor);

    await expect(follow.select('object'))
      .resolves
      .toHaveProperty('id', object.id);
  });

  test('creates follow from ActivityStreams representation given uppercase username', async () => {
    const [actor, object] = await Promise.all([
      fabricateRemoteAccount()
        .then(account => account.select('actor'))
        .then(unwrap),
      fabricateLocalAccount({ actor: { username: 'OBJECT' } })
        .then(account => account.select('actor'))
        .then(unwrap)
    ]);

    const activity = new ParsedActivityStreams(repository, {
      type: 'Follow',
      object: 'https://xn--kgbechtv/@OBJECT'
    }, AnyHost);

    const follow = await Follow.createFromParsedActivityStreams(
      repository, activity, actor);

    expect(follow).toHaveProperty('actor', actor);

    await expect(follow.select('object'))
      .resolves
      .toHaveProperty('id', object.id);
  });

  test('rejects with TypeNotAllowed if type is not Follow', async () => {
    const [actor] = await Promise.all([
      fabricateRemoteAccount(),
      fabricateLocalAccount({ actor: { username: 'OBJECT' } })
    ]);

    const activity = new ParsedActivityStreams(repository, {
      object: 'https://xn--kgbechtv/@OBJECT'
    }, AnyHost);

    await expect(Follow.createFromParsedActivityStreams(
      repository, activity, unwrap(await actor.select('actor'))))
      .rejects.toBeInstanceOf(TypeNotAllowed);
  });

  test('posts to remote inbox', async () => {
    const [actor] = await Promise.all([
      fabricateLocalAccount()
        .then(account => account.select('actor'))
        .then(unwrap),
      fabricateRemoteAccount(
        { uri: { uri: 'https://ObJeCt.إختبار/' } })
    ]);

    const activity = new ParsedActivityStreams(repository, {
      type: 'Follow',
      object: 'https://ObJeCt.إختبار/'
    }, AnyHost);

    await expect(Follow.createFromParsedActivityStreams(
      repository, activity, actor)).resolves.toBeInstanceOf(Follow);

    await expect((await repository.queue.getWaiting())[0])
      .toHaveProperty(['data', 'type'], 'postFollow');
  });
});