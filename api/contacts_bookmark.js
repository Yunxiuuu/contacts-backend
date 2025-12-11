// api/contacts_bookmark.js
const dbConnect = require("./mongo");
const Contact = require("./contact-model");

module.exports = async (req, res) => {
  try {
    await dbConnect();

    if (req.method !== "PATCH") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const { bookmark } = req.body;
    const updated = await Contact.findByIdAndUpdate(id, { bookmark }, { new: true });
    return res.status(200).json(updated);
  } catch (err) {
    console.error("PATCH /api/contacts_bookmark error:", err);
    return res.status(500).json({ error: err.message });
  }
};
