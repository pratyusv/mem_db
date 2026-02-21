export interface KeyValueStore {
  set(key: string, value: string, ttlMs?: number): void;
  get(key: string): string | undefined;
  remove(key: string): boolean;
}
