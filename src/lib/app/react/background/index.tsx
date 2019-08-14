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

import * as React from 'react';
import {
  Route,
  RouteProps,
  RouteComponentProps,
  Switch,
  match,
  matchPath
} from 'react-router';
import { MiddlewareAPI, Plain } from '../../redux/types';
import Actor from './actor';
import Note from './note';
import NotFound from './not_found';
import { loadPageActor, loadPageNote } from '../../redux/action';

const routes: {
  initialize(
    api: MiddlewareAPI,
    plain: Plain,
    match: match<{ [key: string]: string }>
  ): Promise<void>;
  readonly props: Readonly<RouteProps>;
}[] = [
  {
    async initialize(api, plain, { params }) {
      return loadPageNote(params.acct, params.id)(api, plain);
    },
    props: {
      path: '/@:acct/:id',
      render({ match, staticContext }) {
        return (
          <Note
            acct={match.params.acct}
            id={match.params.id}
            staticContext={staticContext} />
        );
      }
    }
  },
  {
    initialize(api, plain, { params }) {
      return loadPageActor(params.acct)(api, plain);
    },
    props: {
      path: '/@:acct',
      render({ match, staticContext }) {
        return <Actor acct={match.params.acct} staticContext={staticContext} />;
      }
    }
  },
  {
    async initialize() {
    },
    props: {
      render({ staticContext }: RouteComponentProps<{}>) {
        if (staticContext) {
          staticContext.statusCode = 404;
        }
      
        return <NotFound />;
      }
    }
  }
];

export function initialize(path: string, api: MiddlewareAPI, plain: Plain) {
  for (const { initialize, props } of routes) {
    const match = matchPath(path, props);
    if (match) {
      return initialize(api, plain, match);
    }
  }
}

export default class extends React.PureComponent {
  render() {
    return (
      <Switch>
        {routes.map(({ props }, index) => <Route key={index} {...props} />)}
      </Switch>
    );
  }
}
