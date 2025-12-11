import dbConnect from "./mongo";
import Contact from "./contact-model";

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;
  const { bookmark } = req.body;

  const updated = await Contact.findByIdAndUpdate(
    id,
    { bookmark },
    { new: true }
  );

  res.status(200).json(updated);
}
