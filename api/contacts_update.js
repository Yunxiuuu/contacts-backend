const Contact = require("./contact-model");
require("./mongo");

module.exports = async (req, res) => {
  try {
    if (req.method !== "PUT") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const updated = await Contact.findByIdAndUpdate(req.query.id, req.body, {
      new: true,
    });

    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
