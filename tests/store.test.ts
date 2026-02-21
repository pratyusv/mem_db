import assert from 'node:assert/strict';
import test from 'node:test';

import { handleRequest } from '../src/api/request_handler';
import { Database } from '../src/domain/database';
import { HashMapStore } from '../src/domain/hash_map_store';

test('set/get/delete flow', () => {
  const db = new Database(new HashMapStore());

  const setResp = handleRequest(
    db,
    'POST',
    '/v1/kv/set',
    JSON.stringify({ key: 'a', value: '1' }),
  );
  assert.equal(setResp.status, 200);

  const getResp = handleRequest(db, 'GET', '/v1/kv/get?key=a', '');
  assert.equal(getResp.status, 200);
  assert.equal(getResp.body.found, true);
  assert.equal(getResp.body.value, '1');

  const delResp = handleRequest(db, 'DELETE', '/v1/kv/delete?key=a', '');
  assert.equal(delResp.status, 200);
  assert.equal(delResp.body.deleted, true);

  const getAfter = handleRequest(db, 'GET', '/v1/kv/get?key=a', '');
  assert.equal(getAfter.status, 200);
  assert.equal(getAfter.body.found, false);
});

test('ttl expiration', async () => {
  const db = new Database(new HashMapStore());

  const setResp = handleRequest(
    db,
    'POST',
    '/v1/kv/set',
    JSON.stringify({ key: 'ttl', value: 'v', ttl_ms: 50 }),
  );
  assert.equal(setResp.status, 200);

  await new Promise((resolve) => setTimeout(resolve, 90));

  const getResp = handleRequest(db, 'GET', '/v1/kv/get?key=ttl', '');
  assert.equal(getResp.status, 200);
  assert.equal(getResp.body.found, false);
});

test('validation rejects bad inputs', () => {
  const db = new Database(new HashMapStore());

  const missingKey = handleRequest(
    db,
    'POST',
    '/v1/kv/set',
    JSON.stringify({ value: 'x' }),
  );
  assert.equal(missingKey.status, 400);

  const badTtl = handleRequest(
    db,
    'POST',
    '/v1/kv/set',
    JSON.stringify({ key: 'k', value: 'x', ttl_ms: 0 }),
  );
  assert.equal(badTtl.status, 400);

  const missingGetKey = handleRequest(db, 'GET', '/v1/kv/get', '');
  assert.equal(missingGetKey.status, 400);
});
