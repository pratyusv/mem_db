# mem_db

TypeScript/Node background in-memory DB service with HTTP+JSON API.

## Project Structure

```text
src/
  api/
    request_handler.ts
  domain/
    database.ts
    key_value_store.ts
    hash_map_store.ts
  server/
    http_server.ts
  index.ts
tests/
  store.test.ts
  server.test.ts
```

- `domain/database.ts`: orchestration layer used by API.
- `domain/key_value_store.ts`: storage interface contract.
- `domain/hash_map_store.ts`: in-memory hashmap implementation with TTL.
- `api/request_handler.ts`: HTTP route + validation logic.
- `server/http_server.ts`: Node HTTP server bootstrap and lifecycle.

## Features

- `POST /v1/kv/set`
- `GET /v1/kv/get?key=...`
- `DELETE /v1/kv/delete?key=...`
- `GET /healthz`
- TTL support via `ttl_ms`
- Graceful shutdown on `SIGINT`/`SIGTERM`

## Requirements

- Node.js 20+ (Node 22 recommended)

## Quick Start

```bash
npm install
npm run build
npm start -- --host 127.0.0.1 --port 8080
```

## Endpoints

### Health

`GET /healthz`

Response:

```json
{"status":"ok"}
```

### Set

`POST /v1/kv/set`

Request body:

```json
{"key":"abc","value":"123","ttl_ms":1000}
```

- `ttl_ms` is optional and must be a positive integer if provided.

Response:

```json
{"ok":true}
```

### Get

`GET /v1/kv/get?key=abc`

Found:

```json
{"found":true,"value":"123"}
```

Not found or expired:

```json
{"found":false}
```

### Delete

`DELETE /v1/kv/delete?key=abc`

Response:

```json
{"deleted":true}
```

or

```json
{"deleted":false}
```

## curl Examples

```bash
curl -s http://127.0.0.1:8080/healthz

curl -s -X POST http://127.0.0.1:8080/v1/kv/set \
  -H 'Content-Type: application/json' \
  -d '{"key":"abc","value":"123","ttl_ms":1000}'

curl -s "http://127.0.0.1:8080/v1/kv/get?key=abc"

curl -s -X DELETE "http://127.0.0.1:8080/v1/kv/delete?key=abc"
```

## Browser Usage

- You can open GET routes directly in browser:
  - `http://127.0.0.1:8080/healthz`
  - `http://127.0.0.1:8080/v1/kv/get?key=abc`
- For `POST`/`DELETE`, use:
  - `curl`, Postman, Insomnia, or
  - Chrome DevTools Console with `fetch(...)`

## Scripts

- `npm run build`: compile TypeScript to `dist/`
- `npm start`: run compiled server
- `npm test`: compile + run unit/integration tests

## Response Semantics

- `400`: invalid input/body/query
- `405`: method not allowed for known endpoint
- `404`: unknown route
- `200`: successful route handling (`found:false` for missing keys)

## Troubleshooting

- `EADDRINUSE` on startup:
  - Port is already in use. Change port:
    - `npm start -- --host 127.0.0.1 --port 8081`
  - Or kill the existing process on port 8080.
- `MODULE_NOT_FOUND` for `dist`:
  - Run `npm run build` before `npm start`.
