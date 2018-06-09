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

import nock from 'nock';
import LocalAccount from './local_account';
import Person from './person';
import postToInbox from './post_to_inbox';
import RemoteAccount from './remote_account';
import repository from './test_repository';
import URI from './uri';

async function post() {
  const sender = new LocalAccount({
    repository,
    person: new Person({
      repository,
      username: 'SeNdEr',
      host: null
    }),
    admin: true,
    privateKeyPem: `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Rdj53hR4AdsiRcqt1zdgQHfIIJEmJ01vbALJaZXq951JSGT
rcO6S16XQ3tffCo0QA7G1MOzTeOEJHMiNM4jQQuY0NgDGMs3KEgo0J4ik75VnlyO
iSyFZXCKA/X4vsYZsKyCHGCrbHA6J2m21rbFKj4XChLryn5ZnH6LkdZcaePZwrZ2
/POH8XwTGVMBijGLD/jTLcRlf8LaMRsdRRACZ0bxlxb4Fsk6h5Q1B49HL28QD6Ss
c1bCka4wL4+Pn6kvt+9NH+dYHZAY2elf5rPWDCpOjcVw3lKXKCv0jp9nwU4svGxi
B0te+DHYFaVXQy60WzCEFjiQPZ8XdNQKvDyjKwIDAQABAoIBACCmoGky9sYfIqm9
vmPn0ockva0b6o5SbmPyq6rzcNlb4bsspR0LZXoDiWd2SpDfHk2qgQ4UiVluX+I5
QGwyjHrJztE+Ci3C/hgCPK1nJEsh+8jA91kgZKxUiJjZvkA8OyLFrYO07NAALnSd
I3ogDGXuUDa4ga2bUW8Iq87YRJIcRBNpT91vlUMPGTY/cvEXpSXFvr86ozuTmqAh
Ccp/7WmbQiQEozJJbpJeLbGPiBEF3hP3oBXkKl7GenpseccgtfiZzm4IySnfaNr2
Tc5DcJiw5z6w7lxZE0JIyRJdYTsTTLEP96QddOrI7pfrk/03fcJ1/jVIMdGt6xLv
Qqb6XcECgYEA+wsqKQDJNHCJnjA3MKg6N6wNCUl3I5Fo8p0Vod6sGqZngLrZ8fTP
9t+49kM04E9TBI2J5wb/1nnoLtfkm6tdo9xEM2YDtpDfmdjwWdGqe/QXDVFIT/oK
Oh8iM7TOYnd0l+5VKrHa3VLSgpYpA9Lq4PWRI3n7SLr4nGL6YTEiv9sCgYEA1Tgw
UZ5S+4k+MbzQ8Tz0awTLAaZuULwAMm3B5Pku7SsRefvWYinc0362rBZrq9obkTDQ
efDpM4+sKKSWyT05wig4Ad2608M1AWvBn0H7Unx/HqBK+QlRh1N7CSoaLHM1/cHq
xcPgcjsdKSaUStBIwRZh3+csV4Xb19pPMQRL8vECgYEAnokXb9tyNO6YydAzGkQy
t7Osa9/8H/cVKpmu7pE7aH0Lwgy91AHBT2tLWCFrA/i0OZzUqJQP/rbvvJ1UXkZj
FTblzvuufp2Qx4xrhJ1Wp36nDB73pqIF0VyV8cdNynsbo1K8cADvcXN7Q0Jm1mZd
NAGATcIbwXtpwwDyk2w/QJ8CgYBIjsxymewnSPbvOg/oaBPM716d+yMDOlbe0lbv
MpTzhHp4BmlYEmLhXfeP7DlLy/chm3j2ZjMVpsixNAFUDg+/sKwOhoPzWDSLfT3w
kiWSVmdz5pxczvz9jj0KS1eI1NQEvJ7GGfghJ1ivDj/cjbCUdKdt6F9AkX7Un6ff
SFUIIQKBgBBMvSxRcDCiF5hdV2jVSmFMrdy6mt8kLWZh+vGUu5OOGXIn8xqDeqze
PtM8uICJERUD+p/WiEmEyC3Pd8F7db3zxt34L5BhQ5w2HnPpumDTGNUeuV4byF4z
OyJRYe+sFKZ6lXqnwdWuTrxTNucFuhw+6BVyzNn6lI5cNXLr1reH
-----END RSA PRIVATE KEY-----
`,
    salt: '',
    serverKey: '',
    storedKey: ''
  });

  const recipient = new RemoteAccount({
    repository,
    person: new Person({
      repository,
      username: 'ReCiPiEnT',
      host: 'FiNgEr.ReCiPiEnT.إختبار'
    }),
    inboxURI: new URI({ repository, uri: 'https://ReCiPiEnT.إختبار/?inbox' }),
    publicKeyURI: new URI({ repository, uri: '' }),
    publicKeyPem: '',
    uri: new URI({ repository, uri: '' })
  });

  await Promise.all([
    repository.insertLocalAccount(sender),
    repository.insertRemoteAccount(recipient)
  ]);

  return postToInbox(repository, sender, await recipient.select('inboxURI'), {
    async toActivityStreams() {
      return { type: 'https://example.com/' };
    },
  });
}

test('delivers to remote account', async () => {
  /*
    ActivityPub
    7. Server to Server Interactions
    https://www.w3.org/TR/activitypub/#server-to-server-interactions
    > POST requests (eg. to the inbox) MUST be made with a Content-Type of
    > application/ld+json; profile="https://www.w3.org/ns/activitystreams"

    Mastodon requires HTTP signature:
    HTTP signatures (#4146) · tootsuite/mastodon@1618b68
    https://github.com/tootsuite/mastodon/commit/1618b68bfa740ed655ac45d7d5f4f46fed6c8c62#diff-5b3d0ae6b9258cbe471d5b2a3a1646a6

    reqheaders ignored · Issue #748 · node-nock/nock
    https://github.com/node-nock/nock/issues/748
  */
  const nockPost = nock('https://ReCiPiEnT.إختبار')
    .matchHeader('Content-Type', 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"')
    .matchHeader('Signature', /keyId="https:\/\/xn--kgbechtv\/@SeNdEr#key",algorithm="rsa-sha256",headers="date",signature=".*"/)
    .post('/?inbox', {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'https://example.com/'
    })
    .reply(200);

  try {
    await post();
    expect(nockPost.isDone()).toBe(true);
  } finally {
    nock.cleanAll();
  }
});

test('rejects if failed to deliver to remote object', async () => {
  const nockPost = nock('https://ReCiPiEnT.إختبار')
    .post('/?inbox')
    .replyWithError('');

  try {
    await expect(post()).rejects.toBeInstanceOf(Error);
    expect(nockPost.isDone());
  } finally {
    nock.cleanAll();
  }
});

test('resolves even if response has body', async () => {
  const nockPost = nock('https://ReCiPiEnT.إختبار')
    .post('/?inbox')
    .reply(200, 'body');

  try {
    await post();
    expect(nockPost.isDone()).toBe(true);
  } finally {
    nock.cleanAll();
  }
});