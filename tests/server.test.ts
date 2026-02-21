import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createMemDbServer,
  shutdownServer,
  startServer,
} from '../src/server/http_server';

async function startServerOrSkip(t: any): Promise<{ server: any; base: string } | null> {
  const { server } = createMemDbServer();
  try {
    await startServer(server, { host: '127.0.0.1', port: 0 });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'EPERM') {
      t.skip('socket bind not allowed in this environment');
      return null;
    }
    throw error;
  }

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Server address unavailable');
  }

  return { server, base: `http://127.0.0.1:${address.port}` };
}

test('health endpoint', async (t) => {
  const started = await startServerOrSkip(t);
  if (!started) {
    return;
  }
  const { server, base } = started;
  try {
    const resp = await fetch(`${base}/healthz`);
    assert.equal(resp.status, 200);
    const body = (await resp.json()) as { status: string };
    assert.equal(body.status, 'ok');
  } finally {
    await shutdownServer(server);
  }
});

test('http kv flow', async (t) => {
  const started = await startServerOrSkip(t);
  if (!started) {
    return;
  }
  const { server, base } = started;
  try {
    const setResp = await fetch(`${base}/v1/kv/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'k', value: 'v' }),
    });
    assert.equal(setResp.status, 200);

    const getResp = await fetch(`${base}/v1/kv/get?key=k`);
    assert.equal(getResp.status, 200);
    const getBody = (await getResp.json()) as { found: boolean; value?: string };
    assert.equal(getBody.found, true);
    assert.equal(getBody.value, 'v');

    const delResp = await fetch(`${base}/v1/kv/delete?key=k`, { method: 'DELETE' });
    assert.equal(delResp.status, 200);

    const getAfterResp = await fetch(`${base}/v1/kv/get?key=k`);
    const getAfterBody = (await getAfterResp.json()) as { found: boolean };
    assert.equal(getAfterBody.found, false);
  } finally {
    await shutdownServer(server);
  }
});
