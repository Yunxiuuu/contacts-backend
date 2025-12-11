import dbConnect from "./mongo";
import Contact from "./contact-model";

export default async function handler(req, res) {
  await dbConnect();

  const data = req.body;

  if (!data.name || !data.phone) {
    return res.status(400).json({ error: "Name and Phone are required." });
  }

  const contact = await Contact.create(data);
  res.status(200).json(contact);
}
