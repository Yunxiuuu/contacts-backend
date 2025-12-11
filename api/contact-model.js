import mongoose from "mongoose";

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

export default mongoose.models.Contact ||
  mongoose.model("Contact", contactSchema);
