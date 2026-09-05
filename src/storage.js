// Client-side storage, backed by a real database (see /api/storage.js) instead
// of the browser's localStorage. This fixes data disappearing on some browsers
// (notably iOS Safari, which can clear localStorage when the app is fully
// closed) and means the same data shows up on any device, not just the one
// that uploaded it.
//
// Same get/set/delete/list shape as before, so DreGerencial.jsx and
// SalesDashboard.jsx didn't need to change at all.

const BASE = "/api/storage";

async function readJson(res) {
  try {
    return await res.json();
  } catch (e) {
    return {};
  }
}

export const storage = {
  async get(key) {
    const res = await fetch(`${BASE}?key=${encodeURIComponent(key)}`);
    if (res.status === 404) {
      throw new Error(`Key "${key}" not found`);
    }
    if (!res.ok) {
      const data = await readJson(res);
      throw new Error(data.error || `Erro ${res.status} ao ler "${key}"`);
    }
    const data = await res.json();
    return { key, value: data.value, shared: true };
  },

  async set(key, value) {
    const res = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) {
      const data = await readJson(res);
      throw new Error(data.error || `Erro ${res.status} ao salvar "${key}"`);
    }
    return { key, value, shared: true };
  },

  async delete(key) {
    const res = await fetch(`${BASE}?key=${encodeURIComponent(key)}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await readJson(res);
      throw new Error(data.error || `Erro ${res.status} ao apagar "${key}"`);
    }
    return { key, deleted: true, shared: true };
  },

  async list(prefix = "") {
    const res = await fetch(`${BASE}?list=1&prefix=${encodeURIComponent(prefix)}`);
    if (!res.ok) {
      const data = await readJson(res);
      throw new Error(data.error || `Erro ${res.status} ao listar chaves`);
    }
    const data = await res.json();
    return { keys: data.keys, prefix, shared: true };
  },
};

if (typeof window !== "undefined") {
  window.storage = storage;
}

// Checks whether /api/storage is reachable and the database is connected.
// Returns true/false; App.jsx uses this to show a warning banner instead of
// letting saves fail silently (or with a confusing error) later.
export async function checkStorageHealth() {
  try {
    const res = await fetch(`${BASE}?key=__healthcheck__`);
    if (res.status === 404) return { ok: true }; // reachable, key just doesn't exist yet
    if (res.ok) return { ok: true };
    const data = await readJson(res);
    return { ok: false, error: data.error || `Erro ${res.status}` };
  } catch (e) {
    return { ok: false, error: "Não consegui contactar /api/storage." };
  }
}
