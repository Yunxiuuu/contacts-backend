const Contact = require("./contact-model");
require("./mongo");

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { name, phone, bookmark } = req.query;
    let filter = {};

    if (name) filter.name = { $regex: name, $options: "i" };
    if (phone) filter.phone = { $regex: phone, $options: "i" };
    if (bookmark === "true") filter.bookmark = true;

    const contacts = await Contact.find(filter).sort({ name: 1 });
    return res.status(200).json(contacts);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
