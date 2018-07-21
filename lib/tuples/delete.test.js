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
import { fabricateNote } from '../test/fabricator';
import repository from '../test/repository';
import { unwrap } from '../test/types';
import Delete from './delete';

describe('createFromParsedActivityStreams', () => {
  test('deletes note', async () => {
    const note = await fabricateNote(
      { status: { uri: {  uri: 'https://ReMoTe.إختبار/' } } });

    const status = unwrap(await note.select('status'));
    const actor = unwrap(await status.select('actor'));
    const activityStreams = new ParsedActivityStreams(repository, {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Delete',
      object: 'https://ReMoTe.إختبار/'
    }, AnyHost);

    await expect(Delete.createFromParsedActivityStreams(
      repository, activityStreams, actor))
        .resolves
        .toBeInstanceOf(Delete);

    await expect(repository.selectRecentStatusesIncludingExtensionsByActorId(status.actorId))
      .resolves
      .toEqual([]);
  });

  test('rejects with TypeNotAllowed if type is not Delete', async () => {
    const note = await fabricateNote(
      { status: { uri: {  uri: 'https://ReMoTe.إختبار/' } } });

    const status = unwrap(await note.select('status'));
    const activityStreams = new ParsedActivityStreams(repository, {
      '@context': 'https://www.w3.org/ns/activitystreams',
      object: 'https://ReMoTe.إختبار/'
    }, AnyHost);

    await expect(Delete.createFromParsedActivityStreams(
      repository, activityStreams, unwrap(await status.select('actor'))))
        .rejects
        .toBeInstanceOf(TypeNotAllowed);
  });
});