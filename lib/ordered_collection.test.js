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

import ActivityStreams from './activitystreams';
import OrderedCollection from './ordered_collection';
import repository from './test_repository';

describe('toActivityStreams', () =>
  test('returns ActivityStreams representation', async () => {
    const collection = new OrderedCollection({
      orderedItems: [
        {
          async toActivityStreams(givenRepository) {
            expect(givenRepository).toBe(repository);
            return new ActivityStreams('https://إختبار');
          }
        }
      ]
    });

    const object = await collection.toActivityStreams(repository);

    expect(object).toHaveProperty(['body', 'type'], 'OrderedCollection');
    expect(object).toHaveProperty(['body', 'orderedItems'], ['https://إختبار']);
  }));
