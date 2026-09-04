// Standalone replacement for the window.storage API available inside Claude artifacts.
// Same shape (get/set/delete/list, all async), backed by the browser's localStorage,
// so the dashboard component didn't need to change to run outside claude.ai.
// Data lives only in this browser (per device/browser profile), not shared across users.

const PREFIX = "painel-vendas:";

function fullKey(key) {
  return PREFIX + key;
}

export const storage = {
  async get(key) {
    const raw = window.localStorage.getItem(fullKey(key));
    if (raw === null) {
      throw new Error(`Key "${key}" not found`);
    }
    return { key, value: raw, shared: false };
  },

  async set(key, value) {
    window.localStorage.setItem(fullKey(key), value);
    return { key, value, shared: false };
  },

  async delete(key) {
    const existed = window.localStorage.getItem(fullKey(key)) !== null;
    window.localStorage.removeItem(fullKey(key));
    return { key, deleted: existed, shared: false };
  },

  async list(prefix = "") {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(fullKey(prefix))) {
        keys.push(k.slice(PREFIX.length));
      }
    }
    return { keys, prefix, shared: false };
  },
};

if (typeof window !== "undefined") {
  window.storage = storage;
}
