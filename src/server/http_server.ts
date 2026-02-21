import { once } from 'node:events';
import { createServer } from 'node:http';

import { handleRequest } from '../api/request_handler';
import { Database } from '../domain/database';
import { HashMapStore } from '../domain/hash_map_store';

export type MemDbServerConfig = {
  host: string;
  port: number;
};

function readBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export function createMemDbServer(): { server: any; db: Database } {
  const store = new HashMapStore();
  const db = new Database(store);

  const server = createServer(async (req: any, res: any) => {
    try {
      const method = req.method ?? 'GET';
      const target = req.url ?? '/';
      const body = method === 'POST' ? await readBody(req) : '';
      const response = handleRequest(db, method, target, body);

      res.statusCode = response.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(response.body));
    } catch {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'internal server error' }));
    }
  });

  return { server, db };
}

export async function startServer(
  server: any,
  config: MemDbServerConfig,
): Promise<void> {
  server.listen(config.port, config.host);
  const result = await Promise.race([
    once(server, 'listening').then(() => ({ ok: true as const })),
    once(server, 'error').then((args) => ({ ok: false as const, err: args[0] })),
  ]);
  if (result.ok === false) {
    throw result.err;
  }
}

export async function shutdownServer(server: any): Promise<void> {
  server.close();
  await once(server, 'close');
}
