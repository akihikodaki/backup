/*
  Copyright (C) 2019  Miniverse authors

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

import { AbortSignal } from 'abort-controller';
import express = require('express');
import Repository from '../../lib/repository';
import LocalAccount from '../../lib/tuples/local_account';

export interface Application extends express.Application {
  readonly locals: {
    repository: Repository;
  };
}

export interface Response extends express.Response {
  readonly app: Application;
  readonly locals: {
    signal: AbortSignal;
    user: LocalAccount | null;
  };
}
