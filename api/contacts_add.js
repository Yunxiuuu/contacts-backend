// api/contacts_add.js
const dbConnect = require("./mongo");
const Contact = require("./contact-model");

module.exports = async (req, res) => {
  try {
    await dbConnect();

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const data = req.body;
    if (!data || !data.name || !data.phone) {
      return res.status(400).json({ error: "Name and Phone are required." });
    }

    const contact = new Contact(data);
    await contact.save();
    return res.status(201).json(contact);
  } catch (err) {
    console.error("POST /api/contacts_add error:", err);
    return res.status(500).json({ error: err.message });
  }
};
