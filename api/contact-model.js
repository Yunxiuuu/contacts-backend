// api/contact-model.js
const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    other: String,
    bookmark: { type: Boolean, default: false },
    contactMethods: [
      {
        type: { type: String, required: true },
        value: { type: String, required: true },
        label: String
      }
    ]
  },
  { timestamps: true }
);

// 防止热重载或 Serverless 中重复 model 注册错误
module.exports = mongoose.models.Contact || mongoose.model("Contact", contactSchema);
