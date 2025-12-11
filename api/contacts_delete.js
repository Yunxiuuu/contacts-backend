const Contact = require("./contact-model");
require("./mongo");

module.exports = async (req, res) => {
  try {
    if (req.method !== "DELETE") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (req.query.id) {
      await Contact.findByIdAndDelete(req.query.id);
      return res.status(200).json({ msg: "Deleted" });
    } else {
      await Contact.deleteMany({});
      return res.status(200).json({ msg: "All cleared" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
