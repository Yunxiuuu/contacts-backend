const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'contacts.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

function readDB() {
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  try {
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json());

// Multer for file upload (import)
const upload = multer({ storage: multer.memoryStorage() });

// Helper: normalize contact shape
function normalizeContact(input) {
  return {
    id: input.id || uuidv4(),
    name: input.name || '',
    note: input.note || '',
    methods: Array.isArray(input.methods) ? input.methods.map(m => ({
      type: m.type || 'phone',
      value: m.value || '',
      label: m.label || ''
    })) : [],
    bookmarked: !!input.bookmarked,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// GET /contacts  (supports ?bookmarked=true)
app.get('/contacts', (req, res) => {
  const db = readDB();
  const { bookmarked } = req.query;
  let result = db;
  if (bookmarked === 'true') {
    result = db.filter(c => !!c.bookmarked);
  }
  res.json(result);
});

// GET /contacts/:id
app.get('/contacts/:id', (req, res) => {
  const db = readDB();
  const contact = db.find(c => c.id === req.params.id);
  if (!contact) return res.status(404).json({ error: 'Not found' });
  res.json(contact);
});

// POST /contacts
app.post('/contacts', (req, res) => {
  const db = readDB();
  const contact = normalizeContact(req.body);
  db.push(contact);
  writeDB(db);
  res.status(201).json(contact);
});

// PUT /contacts/:id  (replace)
app.put('/contacts/:id', (req, res) => {
  const db = readDB();
  const idx = db.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const updated = normalizeContact(Object.assign({}, req.body, { id: req.params.id, createdAt: db[idx].createdAt }));
  db[idx] = updated;
  writeDB(db);
  res.json(updated);
});

// PATCH /contacts/:id  (partial update)
app.patch('/contacts/:id', (req, res) => {
  const db = readDB();
  const idx = db.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const existing = db[idx];
  const merged = Object.assign({}, existing, req.body, { updatedAt: new Date().toISOString() });
  if (req.body.methods) {
    merged.methods = Array.isArray(req.body.methods) ? req.body.methods.map(m => ({
      type: m.type || 'phone',
      value: m.value || '',
      label: m.label || ''
    })) : existing.methods;
  }
  db[idx] = merged;
  writeDB(db);
  res.json(merged);
});

// PATCH /contacts/:id/bookmark  (toggle or set)
app.patch('/contacts/:id/bookmark', (req, res) => {
  const db = readDB();
  const idx = db.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const setTo = typeof req.body.bookmarked === 'boolean' ? req.body.bookmarked : !db[idx].bookmarked;
  db[idx].bookmarked = setTo;
  db[idx].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(db[idx]);
});

// DELETE /contacts/:id
app.delete('/contacts/:id', (req, res) => {
  let db = readDB();
  const idx = db.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const removed = db.splice(idx, 1)[0];
  writeDB(db);
  res.json({ deleted: true, contact: removed });
});

// GET /contacts/export  -> XLSX download
app.get('/contacts/export', (req, res) => {
  const db = readDB();
  const rows = db.map(c => {
    const base = {
      id: c.id,
      name: c.name,
      note: c.note || '',
      bookmarked: c.bookmarked ? 'true' : 'false',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    };
    (c.methods || []).forEach((m, i) => {
      const idx = i + 1;
      base[`method_${idx}_type`] = m.type;
      base[`method_${idx}_value`] = m.value;
      base[`method_${idx}_label`] = m.label || '';
    });
    return base;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'contacts');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename="contacts.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// POST /contacts/import  -> upload XLSX file
app.post('/contacts/import', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    let db = readDB();
    let created = 0, updated = 0, skipped = 0;

    rows.forEach(row => {
      const id = row.id && String(row.id).trim() !== '' ? String(row.id) : null;
      const name = row.name || '';
      const note = row.note || '';
      const bookmarked = String(row.bookmarked || '').toLowerCase() === 'true';

      const methods = [];
      Object.keys(row).forEach(k => {
        const m = k.match(/^method_(\d+)_type$/);
        if (m) {
          const idx = m[1];
          const type = row[`method_${idx}_type`] || '';
          const value = row[`method_${idx}_value`] || '';
          const label = row[`method_${idx}_label`] || '';
          if (value && String(value).trim() !== '') {
            methods.push({ type, value: String(value), label });
          }
        }
      });

      if (id) {
        const idx = db.findIndex(c => c.id === id);
        if (idx !== -1) {
          db[idx] = Object.assign({}, db[idx], {
            name, note, methods, bookmarked, updatedAt: new Date().toISOString()
          });
          updated++;
        } else {
          const newC = normalizeContact({ id, name, note, methods, bookmarked });
          db.push(newC);
          created++;
        }
      } else {
        const newC = normalizeContact({ name, note, methods, bookmarked });
        db.push(newC);
        created++;
      }
    });

    writeDB(db);
    res.json({ ok: true, created, updated, skipped });
  } catch (err) {
    console.error('Import error', err);
    res.status(500).json({ error: 'Failed to parse file' });
  }
});

// health
app.get('/', (req, res) => {
  res.json({ ok: true });
});

// Export app for serverless. Only listen when run directly.
const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Contacts backend running on ${PORT}`));
}

module.exports = app;
