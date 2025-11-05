// index.js (替换你的现有文件)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());

// CORS: 只允许前端域名（从环境变量读取）
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://contacts-frontend-swart.vercel.app';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
}));

// MongoDB connection: 使用环境变量 MONGODB_URI (必须在 Vercel 后端项目设置)
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/contactsdb';
mongoose.connect(mongoUri, { })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // 如果需要可以在这里退出进程或继续重试，视你的需求
  });

// Mongoose schema & model
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  other: String,
});

const Contact = mongoose.model('Contact', contactSchema);

// Get contacts, support fuzzy search and sorting by name
app.get('/api/contacts', async (req, res) => {
  try {
    const { name, phone } = req.query;
    let filter = {};
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (phone) filter.phone = { $regex: phone, $options: 'i' };
    const contacts = await Contact.find(filter).sort({ name: 1 });
    res.json(contacts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add contact (required name and phone)
app.post('/api/contacts', async (req, res) => {
  try {
    if (!req.body.name || !req.body.phone) {
      return res.status(400).json({ error: 'Name and Phone are required.' });
    }
    const contact = new Contact(req.body);
    await contact.save();
    res.json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update contact
app.put('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete contact by id
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete ALL contacts (Clear All)
app.delete('/api/contacts', async (req, res) => {
  try {
    await Contact.deleteMany({});
    res.json({ msg: 'All contacts cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 端口：使用 process.env.PORT（Vercel/平台会注入）
const port = process.env.PORT || 5000;
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Schema & Model
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  other: String,
});
const Contact = mongoose.model('Contact', contactSchema);

// Routes
app.get('/api/contacts', async (req, res) => {
  const { name, phone } = req.query;
  let filter = {};
  if (name) filter.name = { $regex: name, $options: 'i' };
  if (phone) filter.phone = { $regex: phone, $options: 'i' };
  const contacts = await Contact.find(filter).sort({ name: 1 });
  res.json(contacts);
});

app.post('/api/contacts', async (req, res) => {
  if (!req.body.name || !req.body.phone) {
    return res.status(400).json({ error: 'Name and Phone are required.' });
  }
  const contact = new Contact(req.body);
  await contact.save();
  res.json(contact);
});

app.put('/api/contacts/:id', async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(contact);
});

app.delete('/api/contacts/:id', async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  res.json({ msg: 'Deleted' });
});

app.delete('/api/contacts', async (req, res) => {
  await Contact.deleteMany({});
  res.json({ msg: 'All contacts cleared' });
});

// ❌ 不要再监听端口
// app.listen(5000, () => console.log('Server running...'));

// ✅ 导出 app（Vercel 需要）
module.exports = app;

