import contacts from "./_db";

export default function handler(req, res) {
  const id = Number(req.query.id);

  const index = contacts.findIndex(c => c.id === id);
  if (index !== -1) contacts.splice(index, 1);

  res.json({ success: true });
}
