import { KeyValueStore } from './key_value_store';

type Entry = {
  value: string;
  expiresAtMs?: number;
};

export class HashMapStore implements KeyValueStore {
  private readonly data = new Map<string, Entry>();

  set(key: string, value: string, ttlMs?: number): void {
    const expiresAtMs = ttlMs !== undefined ? Date.now() + ttlMs : undefined;
    this.data.set(key, { value, expiresAtMs });
  }

  get(key: string): string | undefined {
    const entry = this.data.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAtMs !== undefined && Date.now() >= entry.expiresAtMs) {
      this.data.delete(key);
      return undefined;
    }

    return entry.value;
  }

  remove(key: string): boolean {
    return this.data.delete(key);
  }
}
