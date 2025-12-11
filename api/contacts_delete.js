// api/contacts_delete.js
const dbConnect = require("./mongo");
const Contact = require("./contact-model");

module.exports = async (req, res) => {
  try {
    await dbConnect();

    if (req.method !== "DELETE") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const id = req.query.id;
    if (id) {
      await Contact.findByIdAndDelete(id);
      return res.status(200).json({ msg: "Deleted" });
    } else {
      await Contact.deleteMany({});
      return res.status(200).json({ msg: "All contacts cleared" });
    }
  } catch (err) {
    console.error("DELETE /api/contacts_delete error:", err);
    return res.status(500).json({ error: err.message });
  }
};
