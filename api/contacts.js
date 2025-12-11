import contacts from "./_db";

export default function handler(req, res) {
  res.json(contacts);
}
