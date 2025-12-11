const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: String, phone: String, email: String, other: String,
  bookmark: Boolean,
  contactMethods: Array
});

export default mongoose.models.Contact ||
  mongoose.model("Contact", contactSchema);
