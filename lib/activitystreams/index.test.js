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

import repository from '../test_repository';
import ActivityStreams, { AnyHost } from './index';
import Resolver, { CircularError } from './resolver';
const nock = require('nock');

async function testLoading(object, callback) {
  /*
    ActivityPub
    3.2 Retrieving objects
    https://www.w3.org/TR/activitypub/#retrieving-objects
    > The client MUST specify an Accept header with the
    > application/ld+json; profile="https://www.w3.org/ns/activitystreams"
    > media type in order to retrieve the activity.
  */
  const get = nock('https://ReMoTe.إختبار')
    .matchHeader('Accept', 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"')
    .get('/')
    .reply(200, object);

  try {
    await callback();
    expect(get.isDone()).toBe(true);
  } finally {
    nock.cleanAll();
  }
}

describe('constructor', () => {
  test('sets body and normalizedHost according to given string', () => {
    const object = new ActivityStreams('https://ReMoTe.إختبار/', AnyHost);

    expect(object).toHaveProperty('body', 'https://ReMoTe.إختبار/');
    expect(object).toHaveProperty('normalizedHost', 'remote.xn--kgbechtv');
  });

  test('sets body and normalizedHost according to id property of given object', () => {
    const object = new ActivityStreams({ id: 'https://ReMoTe.إختبار/' }, AnyHost);

    expect(object).toHaveProperty('body', { id: 'https://ReMoTe.إختبار/' });
    expect(object).toHaveProperty('normalizedHost', 'remote.xn--kgbechtv');
  });

  /*
    ActivityPub
    3.1 Object Identifiers
    https://www.w3.org/TR/activitypub/#obj-id
    > An ID explicitly specified as the JSON null object, which implies an
    > anonymous object (a part of its parent context) 
  */
  test('sets body and normalizedHost according to given normalizedHost argument if host is not available from given body', () => {
    const object = new ActivityStreams({}, 'remote.xn--kgbechtv');

    expect(object).toHaveProperty('body', {});
    expect(object).toHaveProperty('normalizedHost', 'remote.xn--kgbechtv');
  });

  /*
    ActivityPub
    3. Objects
    https://www.w3.org/TR/activitypub/#obj
    >  it should dereference the id both to ensure that it exists and is a valid
    > object, and that it is not misrepresenting the object. (In this example,
    > Mallory could be spoofing an object allegedly posted by Alice).
  */
  test('disposes given properties if id property and normalizedHost option does not match', () => {
    const object = new ActivityStreams({
      id: 'https://ReMoTe.إختبار/',
      type: 'Add'
    }, 'somewhere.else.xn--kgbechtv');

    expect(object).toHaveProperty('body', 'https://ReMoTe.إختبار/');
    expect(object).toHaveProperty('normalizedHost', 'remote.xn--kgbechtv');
  });

  test('sets given resolver argument', () => {
    const resolver = new Resolver(['https://ReMoTe.إختبار/']);
    const object = new ActivityStreams('https://ReMoTe.إختبار/', AnyHost, resolver);

    expect(object.getActor()).rejects.toBeInstanceOf(CircularError);
  });
});

describe('getActor', () => test('loads and returns actor', () => {
  const object = new ActivityStreams('https://ReMoTe.إختبار/', AnyHost);

  return testLoading({
    '@context': 'https://www.w3.org/ns/activitystreams',
    actor: 'https://ReMoTe.إختبار/actor'
  }, () => expect(object.getActor(repository))
    .resolves
    .toHaveProperty('body', 'https://ReMoTe.إختبار/actor'));
}));

describe('getAttributedTo', () => test('loads and returns attributedTo', () => {
  const object = new ActivityStreams('https://ReMoTe.إختبار/', AnyHost);

  return testLoading({
    '@context': 'https://www.w3.org/ns/activitystreams',
    attributedTo: 'https://ReMoTe.إختبار/attributedTo'
  }, () => expect(object.getAttributedTo(repository))
    .resolves
    .toHaveProperty('body', 'https://ReMoTe.إختبار/attributedTo'));
}));

describe('getContent', () => test('loads and returns content', () => {
  const object = new ActivityStreams('https://ReMoTe.إختبار/', AnyHost);

  return testLoading({
    '@context': 'https://www.w3.org/ns/activitystreams',
    content: '内容'
  }, () => expect(object.getContent(repository)).resolves.toBe('内容'));
}));
