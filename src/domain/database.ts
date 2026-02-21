import { KeyValueStore } from './key_value_store';

export class Database {
  constructor(private readonly store: KeyValueStore) {}

  set(key: string, value: string, ttlMs?: number): void {
    this.store.set(key, value, ttlMs);
  }

  get(key: string): string | undefined {
    return this.store.get(key);
  }

  remove(key: string): boolean {
    return this.store.remove(key);
  }
}
