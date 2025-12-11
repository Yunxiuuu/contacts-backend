const Contact = require("./contact-model");
require("./mongo");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!req.body.name || !req.body.phone) {
      return res.status(400).json({ error: "Name and Phone required" });
    }

    const contact = new Contact(req.body);
    await contact.save();

    return res.status(200).json(contact);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
