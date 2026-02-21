import { once } from 'node:events';

import {
  createMemDbServer,
  shutdownServer,
  startServer,
} from './server/http_server';

function parseArg(name: string, defaultValue: string): string {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1] as string;
  }
  return defaultValue;
}

async function main(): Promise<void> {
  const host = parseArg('--host', '127.0.0.1');
  const portRaw = parseArg('--port', '8080');
  const port = Number(portRaw);

  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    console.error('Invalid --port value');
    process.exit(1);
  }

  const { server } = createMemDbServer();
  try {
    await startServer(server, { host, port });
  } catch (error) {
    console.error(`Failed to start server: ${(error as Error).message}`);
    process.exit(1);
  }

  const address = server.address();
  const boundPort = typeof address === 'object' && address ? address.port : port;
  console.log(`mem_db listening on ${host}:${boundPort}`);

  const stop = async (): Promise<void> => {
    await shutdownServer(server);
  };

  process.on('SIGINT', () => {
    void stop();
  });
  process.on('SIGTERM', () => {
    void stop();
  });

  await once(server, 'close');
  console.log('mem_db stopped');
}

void main();
