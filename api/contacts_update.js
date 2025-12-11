import dbConnect from "./mongo";
import Contact from "./contact-model";

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;
  const updated = await Contact.findByIdAndUpdate(id, req.body, { new: true });

  res.status(200).json(updated);
}
