import dbConnect from "./mongo";
import Contact from "./contact-model";

export default async function handler(req, res) {
  await dbConnect();

  const { name, phone, bookmark } = req.query;

  let filter = {};
  if (name) filter.name = { $regex: name, $options: "i" };
  if (phone) filter.phone = { $regex: phone, $options: "i" };
  if (bookmark === "true") filter.bookmark = true;

  const contacts = await Contact.find(filter).sort({ name: 1 });

  res.status(200).json(contacts);
}
