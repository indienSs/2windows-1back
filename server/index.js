import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  addIds,
  selectIds,
  deselectIds,
  reorder,
  getLeftPage,
  getRightPage,
  getVersion,
  getState,
} from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/left', (req, res) => {
  const { search, offset, limit } = req.query;
  res.json(getLeftPage({ search, offset, limit }));
});

app.get('/api/right', (req, res) => {
  const { search, offset, limit } = req.query;
  res.json(getRightPage({ search, offset, limit }));
});

app.post('/api/add', (req, res) => {
  const added = addIds(req.body?.ids);
  res.json({ ok: true, added });
});

app.post('/api/select', (req, res) => {
  const changed = selectIds(req.body?.ids);
  res.json({ ok: true, changed });
});

app.post('/api/deselect', (req, res) => {
  const changed = deselectIds(req.body?.ids);
  res.json({ ok: true, changed });
});

app.post('/api/reorder', (req, res) => {
  const { activeId, overId } = req.body || {};
  const changed = reorder(activeId, overId);
  res.json({ ok: true, changed });
});

app.get('/api/version', (_req, res) => {
  res.json(getState());
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ...getState() });
});

if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(__dirname, '../dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] state:`, getState());
});
