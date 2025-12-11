import dbConnect from "./mongo";
import Contact from "./contact-model";

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;
  await Contact.findByIdAndDelete(id);

  res.status(200).json({ msg: "Deleted" });
}
