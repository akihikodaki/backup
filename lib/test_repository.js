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

import { Pool } from 'pg';
import Repository from './repository';

// assign process.env.JEST_WORKER_ID=1 when in runInBand mode by ranyitz · Pull Request #5860 · facebook/jest
// https://github.com/facebook/jest/pull/5860
const database = `${process.env.PGDATABASE || process.env.USER}_activenode_test_${process.env.JEST_WORKER_ID || '1'}`;
const redisOptions = {
  keyPrefix: `activenode_test_${process.env.JEST_WORKER_ID}`
};

const testRepository = new Repository({
  console,
  host: 'host.example.com',
  origin: 'https://origin.example.com',
  pg: new Pool({ database }),
  redis: process.env.REDIS ? [process.env.REDIS, redisOptions] : [redisOptions]
});

const { pg, redis } = testRepository;

const asyncTables = testRepository.pg.query(
  'SELECT tablename FROM pg_tables WHERE schemaname = \'public\'');

afterAll(() => {
  redis.client.disconnect();
  redis.subscriber.disconnect();
  return testRepository.pg.end();
});

afterEach(() => Promise.all([
  Promise.all([
    asyncTables,

    // local_accounts has "ON DELETE RESTRICT" constraint
    pg.query('TRUNCATE TABLE local_accounts')
  ]).then(([{ rows }]) => Promise.all(rows.map(({ tablename }) =>
    pg.query(`DELETE FROM ${tablename}`)))),

  redis.client.keys('*').then(keys => redis.client.del(keys))
]));

export default testRepository;
