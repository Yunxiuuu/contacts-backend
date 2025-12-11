import contacts from "./_db";

export default function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).send("Method Not Allowed");

  const { name } = req.body;
  const id = Date.now();

  contacts.push({ id, name });

  res.json({ success: true });
}
