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

import { randomBytes } from 'crypto';
import { Request, NextFunction } from 'express';
import * as React from 'react';
import { renderToNodeStream, renderToString } from 'react-dom/server';
import { AppRegistry } from 'react-native';
import { Provider } from 'react-redux';
import { StaticRouter, StaticRouterContext } from 'react-router';
import { createStore } from 'redux';
import { domainToASCII } from 'url';
import { promisify } from 'util';
import AppReact from '../../lib/app/react';
import { initialize } from '../../lib/app/react/background';
import { Reducible, Type } from '../../lib/app/redux/action';
import reducer from '../../lib/app/redux/reducer';
import { serialize } from '../../lib/app/redux/serialization';
import State from '../../lib/app/redux/state';
import createThunk from '../../lib/app/redux/create_thunk';
import { Ext } from '../../lib/app/redux/types';
import { LocalActor } from '../../lib/generated_activitystreams';
import Challenge from '../../lib/tuples/challenge';
import createReduxPlain from './plain/create_redux';
import { Response } from './types';

const promisifiedRandomBytes = promisify(randomBytes);
const recovery = {};

AppRegistry.registerComponent('miniverse', () => AppReact);

export default async function({ url }: Request, response: Response, next: NextFunction) {
  const { signal, user } = response.locals;
  const { repository } = response.app.locals;
  let bytes;
  let activityStreams;

  try {
    [bytes, activityStreams] = await Promise.all([
      promisifiedRandomBytes(64),
      user && user.select('actor', signal, () => recovery).then(
        actor => actor && actor.toActivityStreams(signal, () => recovery) as
          Promise<LocalActor | null>)
    ]);
  } catch (error) {
    if (error == recovery) {
      response.sendStatus(422);
      return;
    }
    throw error;
  }

  const nonce = bytes.toString('base64');

  if (process.env.NODE_ENV != 'development') {
    const { frame, image, script } = repository.content;
      response.set('Content-Security-Policy', `default-src 'none'; connect-src 'self' data:; frame-src ${frame.sourceList}; img-src ${image.sourceList};script-src 'self' 'nonce-${nonce}' ${script.sourceList}`);
  }

  const { element, getStyleElement } = (AppRegistry as unknown as {
    getApplication(name: string): {
      element: React.ReactElement;
      getStyleElement(props: { nonce: string }): React.ReactElement;
    }
  }).getApplication('miniverse');

  const context: StaticRouterContext = {};
  const host = domainToASCII(repository.host);
  const plain = createReduxPlain(repository, signal, user);

  const store = createStore<State, Reducible, { dispatch: Ext }, never>(reducer, {
    actors: new Map,
    notes: new Map,
    page: { actor: null, note: null },
    session: {
      endpoints: { proxyUrl: `https://${host}/api/proxy` },
      fingerHost: repository.fingerHost,
      host: repository.host,
      nonce,
      user: null
    }
  }, createThunk(plain));

  if (activityStreams) {
    store.dispatch({
      type: Type.SignIn,
      acct: `${activityStreams.preferredUsername}@${repository.fingerHost}`,
      activityStreams
    });
  } else {
    await Challenge.create(repository, bytes);
  }

  await initialize(url, store, plain);

  const string = renderToString(
    <Provider store={store}>
      <StaticRouter context={context} location={url}>
        {element}
      </StaticRouter>
    </Provider>
  );

  if (context.url && context.action == 'REPLACE') {
    response.location(context.url);
    response.status(context.statusCode || 301);
  } else {
    response.status(context.statusCode || 200);
  }

  response.write(`<!DOCTYPE html>
<html>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style nonce="${nonce}">
    @font-face {
      src: url(/static/MaterialIcons.ttf);
      font-family: MaterialIcons;
    }

    @font-face {
      src: url(/static/Lobster-Regular.ttf);
      font-family: Lobster Regular;
    }

    body {
      display: flex;
    }

    body, html {
      width: 100%;
      height: 100%;
    }
  </style>`);

  const styleStream = renderToNodeStream(getStyleElement({ nonce }));

  styleStream.pipe(response, { end: false });

  styleStream.on('end', () => {
    response.write(string);

    // HTML Standard
    // https://html.spec.whatwg.org/multipage/syntax.html#syntax
    // > Raw text elements can have text, though it has restrictions described below.
    //
    // https://html.spec.whatwg.org/multipage/syntax.html#raw-text-elements
    // > Raw text elements: script, style
    //
    // 12.1.2.6 Restrictions on the contents of raw text and escapable raw text elements
    // https://html.spec.whatwg.org/multipage/syntax.html#cdata-rcdata-restrictions
    // The text in raw text and escapable raw text elements must not contain any
    // occurrences of the string "</" (U+003C LESS-THAN SIGN, U+002F SOLIDUS) followed
    // by characters that case-insensitively match the tag name of the element followed
    // by one of U+0009 CHARACTER TABULATION (tab), U+000A LINE FEED (LF), U+000C FORM
    // FEED (FF), U+000D CARRIAGE RETURN (CR), U+0020 SPACE, U+003E GREATER-THAN SIGN
    // (>), or U+002F SOLIDUS (/).
    response.write(`
  <script type="application/json">${JSON.stringify(serialize(store.getState())).replace(/</g, '\\u003c')}</script>
  <script src="/static/main.js"></script>
`);

    response.end();
  });

  styleStream.on('error', next);
}
