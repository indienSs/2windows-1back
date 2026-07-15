const BASE = '/api';

async function getJSON(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function postJSON(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return res.json();
}

export function fetchLeft({ search, offset, limit = 20 }) {
  return getJSON(
    `${BASE}/left?search=${encodeURIComponent(search ?? '')}` +
    `&offset=${offset}&limit=${limit}`,
  );
}
  
export function fetchRight({ search, offset, limit = 20 }) {
  return getJSON(
    `${BASE}/right?search=${encodeURIComponent(search ?? '')}` +
      `&offset=${offset}&limit=${limit}`,
  );
}

export class ApiQueue {
  #opTimer;
  #addTimer;
  constructor({ onFlushed } = {}) {
    this.onFlushed = onFlushed ?? (() => {});

    this.addBatch = new Set();
    this.selectBatch = new Set();
    this.deselectBatch = new Set();
    this.reorderOp = null;

    this.ADD_INTERVAL = 10_000;
    this.OP_INTERVAL = 1_000;

    this.paused = false;

    this.#opTimer = setInterval(() => this.#flushOps(), this.OP_INTERVAL);
    this.#addTimer = setInterval(() => this.#flushAdd(), this.ADD_INTERVAL);
  }

  requestAdd(ids) {
    for (const id of ids) this.addBatch.add(Number(id));
  }

  requestSelect(id) {
    const n = Number(id);
    this.deselectBatch.delete(n);
    this.selectBatch.add(n);
  }

  requestDeselect(id) {
    const n = Number(id);
    this.selectBatch.delete(n);
    this.deselectBatch.add(n);
  }

  requestReorder(activeId, overId) {
    this.reorderOp = { activeId: Number(activeId), overId: Number(overId) };
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  async #flushAdd() {
    if (this.addBatch.size === 0) return;
    const ids = [...this.addBatch];
    this.addBatch.clear();
    try {
      await postJSON('/add', { ids });
      this.onFlushed({ kind: 'add', ids });
    } catch (e) {
      console.error('[queue] flush add failed', e);
    }
  }

  async #flushOps() {
    if (this.paused) return;

    let mutated = false;
    const selects = [...this.selectBatch];
    const deselects = [...this.deselectBatch];
    const reorder = this.reorderOp;

    if (selects.length === 0 && deselects.length === 0 && !reorder) return;

    this.selectBatch.clear();
    this.deselectBatch.clear();
    this.reorderOp = null;

    try {
      if (selects.length) {
        await postJSON('/select', { ids: selects });
        mutated = true;
      }
      if (deselects.length) {
        await postJSON('/deselect', { ids: deselects });
        mutated = true;
      }
      if (reorder) {
        await postJSON('/reorder', reorder);
        mutated = true;
      }
      if (mutated) this.onFlushed({ kind: 'ops' });
    } catch (e) {
      console.error('[queue] flush ops failed', e);
    }
  }

  destroy() {
    clearInterval(this.#opTimer);
    clearInterval(this.#addTimer);
    this.#flushAdd();
    this.#flushOps();
  }
}
