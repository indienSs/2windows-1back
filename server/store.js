export const BASE_MAX = 1_000_000;

const selected = new Set();
const custom = new Set();
let order = [];
let version = 0;

const normaliseIds = (raw) => {
  const out = [];
  if (!Array.isArray(raw)) return out;
  for (const v of raw) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 1 && Number.isInteger(n)) out.push(n);
  }
  return out;
};

export function addIds(rawIds) {
  const ids = normaliseIds(rawIds);
  const added = [];
  for (const id of ids) {
    if ((id >= 1 && id <= BASE_MAX) || custom.has(id)) continue;
    if (id > BASE_MAX || id < 1) custom.add(id);
    added.push(id);
  }
  if (added.length) version++;
  return added;
}

export function selectIds(rawIds) {
  const ids = normaliseIds(rawIds);
  let changed = false;
  for (const id of ids) {
    if (selected.has(id)) continue;
    selected.add(id);
    order.push(id);
    changed = true;
  }
  if (changed) version++;
  return changed;
}

export function deselectIds(rawIds) {
  const ids = normaliseIds(rawIds);
  let changed = false;
  for (const id of ids) {
    if (!selected.has(id)) continue;
    selected.delete(id);
    order = order.filter((x) => x !== id);
    changed = true;
  }
  if (changed) version++;
  return changed;
}

export function reorder(activeId, overId) {
  const a = Number(activeId);
  const b = Number(overId);
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  if (a === b || !selected.has(a) || !selected.has(b)) return false;

  const next = order.filter((x) => x !== a);
  const overIdx = next.indexOf(b);
  if (overIdx === -1) return false;

  const aIdx = order.indexOf(a);
  if (aIdx !== -1 && order[aIdx + 1] === b) return false;

  next.splice(overIdx, 0, a);
  order = next;
  version++;
  return true;
}

const matches = (id, search) => {
  if (search === null || search === undefined || search === '') return true;
  return String(id).includes(String(search).trim());
};

export function getLeftPage({ search, offset = 0, limit = 20 }) {
  const lim = Math.max(1, Math.min(500, Number(limit) || 20));
  const off = Math.max(0, Number(offset) || 0);

  const customSorted = [...custom].sort((x, y) => x - y);
  const customFiltered = customSorted.filter(
    (id) => !selected.has(id) && matches(id, search),
  );

  const items = [];
  let skipped = 0;
  let reachedEndOfBase = false;

  for (let id = 1; id <= BASE_MAX && items.length < lim; id++) {
    const ok = matches(id, search);
    const isSel = selected.has(id);
    if (!ok || isSel) continue;

    if (skipped < off) {
      skipped += 1;
      continue;
    }
    items.push(id);
    if (id === BASE_MAX) reachedEndOfBase = true;
  }

  let baseHasMore = false;
  if (items.length < lim) {
    const need = lim - items.length;
    const customOff = Math.max(0, off - skipped);
    const slice = customFiltered.slice(customOff, customOff + need);
    items.push(...slice);
    baseHasMore = false;
  } else {
    baseHasMore = true;
    if (customFiltered.length) baseHasMore = true;
  }

  return { items, hasMore: baseHasMore };
}

export function getRightPage({ search, offset = 0, limit = 20 }) {
  const lim = Math.max(1, Math.min(500, Number(limit) || 20));
  const off = Math.max(0, Number(offset) || 0);

  const filtered = order.filter((id) => matches(id, search));
  const items = filtered.slice(off, off + lim);
  return { items, hasMore: off + lim < filtered.length };
}

export function getVersion() {
  return version;
}

export function getState() {
  return {
    selectedCount: selected.size,
    orderLength: order.length,
    customCount: custom.size,
    version,
  };
}
