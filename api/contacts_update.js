import contacts from "./_db";

export default function handler(req, res) {
  if (req.method !== "PUT")
    return res.status(405).send("Method Not Allowed");

  const id = Number(req.query.id);
  const { name } = req.body;

  const c = contacts.find(c => c.id === id);
  if (c) c.name = name;

  res.json({ success: true });
}
