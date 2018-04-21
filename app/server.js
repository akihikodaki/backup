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
import { createClient } from 'redis';
import Processor from '../primitives/processor';
import Repository from '../primitives/repository';
import Server from '../primitives/server';

const createClientForEnvironment = process.env.REDIS ?
  () => createClient(process.env.REDIS, { detect_buffers: true }) :
  () => createClient({ detect_buffers: true });

const repository = new Repository({
  console,
  host: process.env.HOST,
  origin: process.env.ORIGIN,
  pg: new Pool,
  redis: {
    publisher: createClientForEnvironment(),
    subscriber: createClientForEnvironment()
  }
});

Processor.process(repository);
Server.serve(repository, process.env.PORT);
