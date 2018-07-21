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

import ParsedActivityStreams,
       { AnyHost, TypeNotAllowed } from '../parsed_activitystreams';
import {
  fabricateAnnounce,
  fabricateFollow,
  fabricateLocalAccount
} from '../test/fabricator';
import repository from '../test/repository';
import { unwrap } from '../test/types';
import Undo from './undo';

describe('createFromParsedActivityStreams', () => {
  test('undoes announce activity', async () => {
    const announce = await fabricateAnnounce(
      { status: { uri: { uri: 'https://NoTe.xn--kgbechtv/' } } });

    const status = unwrap(await announce.select('status'));
    const actor = unwrap(await status.select('actor'));

    const activity = new ParsedActivityStreams(repository, {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Undo',
      object: { type: 'Announce', id: 'https://NoTe.xn--kgbechtv/' }
    }, AnyHost);

    await Undo.createFromParsedActivityStreams(repository, activity, actor);

    await expect(repository.selectStatusById(status.id)).resolves.toBe(null);
  });

  test('undoes follow activity', async () => {
    const activity = new ParsedActivityStreams(repository, {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Undo',
      object: {
        type: 'Follow',
        object: 'https://xn--kgbechtv/@%E8%A2%AB%E8%A1%8C%E5%8B%95%E8%80%85'
      }
    }, AnyHost);

    const [actor, object] = await Promise.all([
      fabricateLocalAccount()
        .then(account => account.select('actor'))
        .then(unwrap),
      fabricateLocalAccount({ actor: { username: '被行動者' } })
        .then(account => account.select('actor'))
        .then(unwrap)
    ]);

    await fabricateFollow({ actor, object });

    await Undo.createFromParsedActivityStreams(repository, activity, actor);

    await expect(repository.selectActorsByFolloweeId(object.id))
      .resolves
      .toEqual([]);
  });

  test('rejects with TypeNotAllowed if type is unknown', async () => {
    const announce = await fabricateAnnounce(
      { status: { uri: { uri: 'https://NoTe.xn--kgbechtv/' } } });

    const status = unwrap(await announce.select('status'));
    const actor = unwrap(await status.select('actor'));

    const activity = new ParsedActivityStreams(repository, {
      '@context': 'https://www.w3.org/ns/activitystreams',
      object: { type: 'Announce', id: 'https://NoTe.xn--kgbechtv/' }
    }, AnyHost);

    await expect(
      Undo.createFromParsedActivityStreams(repository, activity, actor))
        .rejects.toBeInstanceOf(TypeNotAllowed);
  });

  test('rejects with TypeNotAllowed if object type is uknown', async () => {
    const activity = new ParsedActivityStreams(repository, {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Undo',
      object: {
        type: 'Unknown',
        object: 'https://xn--kgbechtv/@%E8%A2%AB%E8%A1%8C%E5%8B%95%E8%80%85'
      }
    }, AnyHost);

    const [actor] = await Promise.all([
      fabricateLocalAccount(),
      fabricateLocalAccount({ actor: { username: '被行動者' } })
    ]);
    const actorActor = unwrap(await actor.select('actor'));

    await expect(
      Undo.createFromParsedActivityStreams(repository, activity, actorActor))
        .rejects.toBeInstanceOf(TypeNotAllowed);
  });

  test('resolves with undo', async () => {
    const activity = new ParsedActivityStreams(repository, {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Undo',
      object: {
        type: 'Follow',
        object: 'https://xn--kgbechtv/@%E8%A2%AB%E8%A1%8C%E5%8B%95%E8%80%85'
      }
    }, AnyHost);

    const objectAccount =
      await fabricateLocalAccount({ actor: { username: '被行動者' } });

    const object = unwrap(await objectAccount.select('actor'));
    const follow = await fabricateFollow({ object });
    const actor = unwrap(await follow.select('actor'));

    await expect(
      Undo.createFromParsedActivityStreams(repository, activity, actor))
        .resolves
        .toBeInstanceOf(Undo);
  });
});