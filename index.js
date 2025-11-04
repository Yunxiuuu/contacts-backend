const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB (use 127.0.0.1 to avoid IPv6 bugs)
mongoose.connect('mongodb://127.0.0.1:27017/contactsdb', {
  // No need for deprecated options in Mongoose 6+
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
  const { name, phone } = req.query;
  let filter = {};
  if (name) filter.name = { $regex: name, $options: 'i' };
  if (phone) filter.phone = { $regex: phone, $options: 'i' };
  const contacts = await Contact.find(filter).sort({ name: 1 });
  res.json(contacts);
});

// Add contact (required name and phone)
app.post('/api/contacts', async (req, res) => {
  if (!req.body.name || !req.body.phone) {
    return res.status(400).json({ error: 'Name and Phone are required.' });
  }
  const contact = new Contact(req.body);
  await contact.save();
  res.json(contact);
});

// Update contact
app.put('/api/contacts/:id', async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(contact);
});

// Delete contact by id
app.delete('/api/contacts/:id', async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  res.json({ msg: 'Deleted' });
});

// Delete ALL contacts (Clear All)
app.delete('/api/contacts', async (req, res) => {
  await Contact.deleteMany({});
  res.json({ msg: 'All contacts cleared' });
});

app.listen(5000, () => {
  console.log('Server started on http://localhost:5000');
});