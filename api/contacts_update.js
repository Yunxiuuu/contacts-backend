// api/contacts_update.js
const dbConnect = require("./mongo");
const Contact = require("./contact-model");

module.exports = async (req, res) => {
  try {
    await dbConnect();

    if (req.method !== "PUT") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const updated = await Contact.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json(updated);
  } catch (err) {
    console.error("PUT /api/contacts_update error:", err);
    return res.status(500).json({ error: err.message });
  }
};
