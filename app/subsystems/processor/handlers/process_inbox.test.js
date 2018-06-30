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

import TemporaryError from '../../../../lib/temporary_error';
import {
  fabricateFollow,
  fabricateLocalAccount,
  fabricateRemoteAccount
} from '../../../../lib/test/fabricator';
import repository from '../../../../lib/test/repository';
import processInbox from './process_inbox';
const nock = require('nock');

const signature = {
  scheme: 'Signature',
  params: {
    keyId: 'https://AcToR.إختبار/users/admin#main-key',
    algorithm: 'rsa-sha256',
    headers: [
      '(request-target)',
      'user-agent',
      'host',
      'date',
      'digest',
      'content-type'
    ],
    signature: 'ys5O1PsRhu2DRI4Uwki5lAJGM4uiridhllYTz19lGsWDcFvevQJJQUzFFgw5r8gJ4BZqD6ZXwYQCLWg26IuLjKRfYOksnIeTqOELGpWN2RjRUDHABMCpGmdhPps+6SY3QXdvVQGPz5DRidC/cJs4kW7t8QIkn/jom6I9D9gb37E87oXn2n2+6QvofyhWjyA422x/PUAfLsSz2hMvzG65BCwTFwVauDRFpKJRDjntyjlmKlC7YTQ4CorkorvqyHpAj8rmVRMfwu6t9XaSE+eqXZfcxTLLDyZwgtQzqnPdrkNOjSJoql+/qMVBIb0O4abx7NtQK7Cp14DKxDPSvWcUOA=='
  },
  signingString: `(request-target): post /@admin/inbox
user-agent: http.rb/3.2.0 (Mastodon/2.3.3; +http://localhost:3000/)
host: localhost
date: Wed, 02 May 2018 06:26:33 GMT
digest: SHA-256=7jyvsrynz1kc0SqwbXlaJBkcNkOtDSG8PGtyJkEfsig=
content-type: application/activity+json`,
  algorithm: 'RSA-SHA256',
  keyId: 'https://AcToR.إختبار/users/admin#main-key'
};

test('performs activities', async () => {
  const [actor, object] = await Promise.all([
    fabricateRemoteAccount({
      publicKeyURI: { uri: 'https://AcToR.إختبار/users/admin#main-key' },
      publicKeyPem: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2NWebZ1RV7DEvjfJNnTH
BofamHENMJd3+aWIXtccUyyPBzfvzyfTXqYfDZUmjei0D5JCJ/ww9Y6ulgBA9Pdx
1Iu2LbvQ6iE19RM01An3kBA/MPelQATPv832/pWxdCjWPP8i2snPbzPZ5gSJP55v
Qj2TY8ZUxWq8rVaCB1+87Kiq88Q/ShS6nCgnph4JSLhAcvSGuSbd+YI8/i1ArQZr
aiM3niRO1Dwz7XPszQ8ygbLWdqM/2pAvckp/lIUm0ufVz5ONGcqjZDVUNh/ZQ5tO
AOc6sswdQZB3Q0FHFgaM5FkAeB07OSK+ndZffVfqfe5YM39470E9uGqC3NQYVkGH
ewIDAQAB
-----END PUBLIC KEY-----
`
    }),
    fabricateRemoteAccount({ uri: { uri: 'https://ObJeCt.إختبار/' } })
  ]);

  await processInbox(repository, {
    data: {
      signature,
      body: `{ "type": "Follow", "object": "https://ObJeCt.إختبار/" }`
    }
  });

  const actors = await repository.selectActorsByFolloweeId(object.actor.id);
  expect(actors[0]).toHaveProperty('id', actor.actor.id);
});

test('does not perform activities if signature verification failed', async () => {
  const [object] = await Promise.all([
    fabricateRemoteAccount({ uri: { uri: 'https://ObJeCt.إختبار/' } }),
    fabricateRemoteAccount({
      publicKeyURI: { uri: 'https://AcToR.إختبار/users/admin#main-key' },
      publicKeyPem: `-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEA0Rdj53hR4AdsiRcqt1zdgQHfIIJEmJ01vbALJaZXq951JSGTrcO6
S16XQ3tffCo0QA7G1MOzTeOEJHMiNM4jQQuY0NgDGMs3KEgo0J4ik75VnlyOiSyF
ZXCKA/X4vsYZsKyCHGCrbHA6J2m21rbFKj4XChLryn5ZnH6LkdZcaePZwrZ2/POH
8XwTGVMBijGLD/jTLcRlf8LaMRsdRRACZ0bxlxb4Fsk6h5Q1B49HL28QD6Ssc1bC
ka4wL4+Pn6kvt+9NH+dYHZAY2elf5rPWDCpOjcVw3lKXKCv0jp9nwU4svGxiB0te
+DHYFaVXQy60WzCEFjiQPZ8XdNQKvDyjKwIDAQAB
-----END RSA PUBLIC KEY-----
`
    }),
  ]);

  await processInbox(repository, {
    data: {
      signature,
      body: '{ "type": "Follow", "object": "https://ObJeCt.إختبار/" }',
    }
  });

  await expect(repository.selectActorsByFolloweeId(object.actor.id))
    .resolves
    .toEqual([]);
});

test('resolves even if object with unsupported type is given', async () => {
  await fabricateRemoteAccount({
    publicKeyURI: { uri: 'https://AcToR.إختبار/users/admin#main-key' },
    publicKeyPem: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2NWebZ1RV7DEvjfJNnTH
BofamHENMJd3+aWIXtccUyyPBzfvzyfTXqYfDZUmjei0D5JCJ/ww9Y6ulgBA9Pdx
1Iu2LbvQ6iE19RM01An3kBA/MPelQATPv832/pWxdCjWPP8i2snPbzPZ5gSJP55v
Qj2TY8ZUxWq8rVaCB1+87Kiq88Q/ShS6nCgnph4JSLhAcvSGuSbd+YI8/i1ArQZr
aiM3niRO1Dwz7XPszQ8ygbLWdqM/2pAvckp/lIUm0ufVz5ONGcqjZDVUNh/ZQ5tO
AOc6sswdQZB3Q0FHFgaM5FkAeB07OSK+ndZffVfqfe5YM39470E9uGqC3NQYVkGH
ewIDAQAB
-----END PUBLIC KEY-----
`
  });

  await expect(processInbox(repository, {
    data: { signature, body: '{ "type": "Unknown" }' }
  })).resolves.toBe(undefined);
});

test('rejects without TemporaryError if all rejections are not temporary', async () => {
  const [actor, object] = await Promise.all([
    fabricateRemoteAccount({
      publicKeyURI: { uri: 'https://AcToR.إختبار/users/admin#main-key' },
      publicKeyPem: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2NWebZ1RV7DEvjfJNnTH
BofamHENMJd3+aWIXtccUyyPBzfvzyfTXqYfDZUmjei0D5JCJ/ww9Y6ulgBA9Pdx
1Iu2LbvQ6iE19RM01An3kBA/MPelQATPv832/pWxdCjWPP8i2snPbzPZ5gSJP55v
Qj2TY8ZUxWq8rVaCB1+87Kiq88Q/ShS6nCgnph4JSLhAcvSGuSbd+YI8/i1ArQZr
aiM3niRO1Dwz7XPszQ8ygbLWdqM/2pAvckp/lIUm0ufVz5ONGcqjZDVUNh/ZQ5tO
AOc6sswdQZB3Q0FHFgaM5FkAeB07OSK+ndZffVfqfe5YM39470E9uGqC3NQYVkGH
ewIDAQAB
-----END PUBLIC KEY-----
`,
    }),
    fabricateLocalAccount({ actor: { username: 'oBjEcT' } })
  ]);

  await fabricateFollow({ actor: actor.actor, object: object.actor });

  const promise = processInbox(repository, {
    data: { signature, body: '{ "type": "Follow", "object": "https://xn--kgbechtv/@oBjEcT" }' }
  });

  await Promise.all([
    expect(promise).rejects.toBeInstanceOf(Error),
    expect(promise).rejects.toHaveProperty('originals'),
    expect(promise).rejects.not.toBeInstanceOf(TemporaryError)
  ]);
});

test('rejects with TemporaryError if some rejection is temporary', async () => {
  await fabricateRemoteAccount({
    publicKeyURI: { uri: 'https://AcToR.إختبار/users/admin#main-key' },
    publicKeyPem: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2NWebZ1RV7DEvjfJNnTH
BofamHENMJd3+aWIXtccUyyPBzfvzyfTXqYfDZUmjei0D5JCJ/ww9Y6ulgBA9Pdx
1Iu2LbvQ6iE19RM01An3kBA/MPelQATPv832/pWxdCjWPP8i2snPbzPZ5gSJP55v
Qj2TY8ZUxWq8rVaCB1+87Kiq88Q/ShS6nCgnph4JSLhAcvSGuSbd+YI8/i1ArQZr
aiM3niRO1Dwz7XPszQ8ygbLWdqM/2pAvckp/lIUm0ufVz5ONGcqjZDVUNh/ZQ5tO
AOc6sswdQZB3Q0FHFgaM5FkAeB07OSK+ndZffVfqfe5YM39470E9uGqC3NQYVkGH
ewIDAQAB
-----END PUBLIC KEY-----
`
  });

  nock('https://uNrEaChAbLe.إختبار').get('/').replyWithError('');

  try {
    const promise = processInbox(repository, {
      data: {
        signature,
        body: '["https://uNrEaChAbLe.إختبار/"]',
      }
    });

    await Promise.all([
      expect(promise).rejects.toBeInstanceOf(TemporaryError),
      expect(promise).rejects.toHaveProperty('originals')
    ]);
  } finally {
    nock.cleanAll();
  }
});
