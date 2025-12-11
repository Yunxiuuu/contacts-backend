import dbConnect from "./mongo";
import Contact from "./contact-model";
import * as xlsx from "xlsx";

export default async function handler(req, res) {
  await dbConnect();

  try {
    const contacts = await Contact.find().sort({ name: 1 });

    const data = contacts.map(contact => {
      const row = {
        "姓名": contact.name,
        "主要电话": contact.phone,
        "邮箱": contact.email || "",
        "其他信息": contact.other || "",
        "书签": contact.bookmark ? "是" : "否",
      };

      if (contact.contactMethods) {
        contact.contactMethods.forEach((m, i) => {
          row[`联系方式${i + 1}-类型`] = m.type;
          row[`联系方式${i + 1}-标签`] = m.label || "";
          row[`联系方式${i + 1}-值`] = m.value;
        });
      }
      return row;
    });

    const workbook = xlsx.utils.book_new();
    const sheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, sheet, "通讯录");

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", "attachment; filename=contacts.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: "导出失败", details: err.message });
  }
}
