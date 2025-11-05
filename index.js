git add .
git commit -m "force redeploy"
git push

// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true,
}));

const MONGODB_URI = process.env.MONGODB_URI;

// --- Connection helper for serverless (cache connection between invocations) ---
async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable not set');
  }

  // If already connected, reuse.
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return;
  }

  // If there is a cached promise, await it to avoid race conditions.
  if (global._mongooseConnectPromise) {
    await global._mongooseConnectPromise;
    return;
  }

  // Create and cache connection promise
  global._mongooseConnectPromise = mongoose.connect(MONGODB_URI, {
    // recommended options are default in mongoose 6+, keep empty or add options if needed
  });

  await global._mongooseConnectPromise;
  console.log('✅ MongoDB connected (serverless)');
}

// --- Schema & Model (protect against model overwrite in serverless hot reload) ---
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  other: String,
}, { timestamps: true });

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

// --- Middleware to ensure DB connected before handling request ---
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('DB connection error:', err);
    // Return a helpful JSON error so you can see it in the browser/net tools
    return res.status(500).json({ error: 'Database connection failed', detail: err.message });
  }
});

// --- Routes ---
app.get('/api/contacts', async (req, res) => {
  try {
    const { name, phone } = req.query;
    const filter = {};
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (phone) filter.phone = { $regex: phone, $options: 'i' };
    const contacts = await Contact.find(filter).sort({ name: 1 });
    res.json(contacts);
  } catch (err) {
    console.error('GET /api/contacts error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

app.post('/api/contacts', async (req, res) => {
  try {
    if (!req.body.name || !req.body.phone) {
      return res.status(400).json({ error: 'Name and Phone are required.' });
    }
    const contact = new Contact(req.body);
    await contact.save();
    res.json(contact);
  } catch (err) {
    console.error('POST /api/contacts error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

app.put('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(contact);
  } catch (err) {
    console.error('PUT /api/contacts/:id error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

app.delete('/api/contacts/:id', async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (err) {
    console.error('DELETE /api/contacts/:id error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

app.delete('/api/contacts', async (req, res) => {
  try {
    await Contact.deleteMany({});
    res.json({ msg: 'All contacts cleared' });
  } catch (err) {
    console.error('DELETE /api/contacts error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Export app for Vercel serverless
module.exports = app;
