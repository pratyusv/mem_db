import { URL } from 'node:url';

import { Database } from '../domain/database';

export type HandlerResponse = {
  status: number;
  body: Record<string, unknown>;
};

function badRequest(message: string): HandlerResponse {
  return { status: 400, body: { error: message } };
}

export function handleRequest(
  db: Database,
  method: string,
  target: string,
  rawBody: string,
): HandlerResponse {
  const url = new URL(target, 'http://localhost');

  if (method === 'GET' && url.pathname === '/healthz') {
    return { status: 200, body: { status: 'ok' } };
  }

  if (url.pathname === '/v1/kv/set') {
    if (method !== 'POST') {
      return { status: 405, body: { error: 'method not allowed' } };
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody || '{}');
    } catch {
      return badRequest('invalid json');
    }

    if (typeof payload !== 'object' || payload === null) {
      return badRequest('invalid json object');
    }

    const key = (payload as Record<string, unknown>).key;
    const value = (payload as Record<string, unknown>).value;
    const ttlMs = (payload as Record<string, unknown>).ttl_ms;

    if (typeof key !== 'string' || key.length === 0) {
      return badRequest('key is required');
    }

    if (typeof value !== 'string') {
      return badRequest('value is required');
    }

    if (ttlMs !== undefined) {
      if (!Number.isInteger(ttlMs) || (ttlMs as number) <= 0) {
        return badRequest('ttl_ms must be a positive integer');
      }
      db.set(key, value, ttlMs as number);
    } else {
      db.set(key, value);
    }

    return { status: 200, body: { ok: true } };
  }

  if (url.pathname === '/v1/kv/get') {
    if (method !== 'GET') {
      return { status: 405, body: { error: 'method not allowed' } };
    }

    const key = url.searchParams.get('key');
    if (!key) {
      return badRequest('key is required');
    }

    const value = db.get(key);
    if (value === undefined) {
      return { status: 200, body: { found: false } };
    }

    return { status: 200, body: { found: true, value } };
  }

  if (url.pathname === '/v1/kv/delete') {
    if (method !== 'DELETE') {
      return { status: 405, body: { error: 'method not allowed' } };
    }

    const key = url.searchParams.get('key');
    if (!key) {
      return badRequest('key is required');
    }

    return { status: 200, body: { deleted: db.remove(key) } };
  }

  return { status: 404, body: { error: 'not found' } };
}
