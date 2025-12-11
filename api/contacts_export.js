// api/contacts_export.js
const dbConnect = require("./mongo");
const Contact = require("./contact-model");
const xlsx = require("xlsx");

module.exports = async (req, res) => {
  try {
    await dbConnect();

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const contacts = await Contact.find().sort({ name: 1 });
    const data = contacts.map((contact) => {
      const row = {
        姓名: contact.name,
        主要电话: contact.phone,
        邮箱: contact.email || "",
        其他信息: contact.other || "",
        书签: contact.bookmark ? "是" : "否",
      };

      if (contact.contactMethods && contact.contactMethods.length) {
        contact.contactMethods.forEach((m, i) => {
          row[`联系方式${i + 1}-类型`] = m.type;
          row[`联系方式${i + 1}-标签`] = m.label || "";
          row[`联系方式${i + 1}-值`] = m.value;
        });
      }

      return row;
    });

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "通讯录");

    // 设置列宽（可选）
    ws["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 8 }];

    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", "attachment; filename=contacts.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    return res.send(buffer);
  } catch (err) {
    console.error("GET /api/contacts_export error:", err);
    return res.status(500).json({ error: err.message });
  }
};
