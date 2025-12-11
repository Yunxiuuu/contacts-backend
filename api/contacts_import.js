// api/contacts_import.js
const dbConnect = require("./mongo");
const Contact = require("./contact-model");
const xlsx = require("xlsx");

module.exports = async (req, res) => {
  try {
    await dbConnect();

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { fileData } = req.body;
    if (!fileData) return res.status(400).json({ error: "未提供文件数据" });

    const buffer = Buffer.from(fileData, "base64");
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const imported = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row["姓名"] || !row["主要电话"]) {
        errors.push(`第 ${i + 2} 行缺少必填字段`);
        continue;
      }

      const contactMethods = [];
      for (let j = 1; j <= 10; j++) {
        if (row[`联系方式${j}-类型`] && row[`联系方式${j}-值`]) {
          contactMethods.push({
            type: row[`联系方式${j}-类型`],
            label: row[`联系方式${j}-标签`] || "",
            value: row[`联系方式${j}-值`],
          });
        }
      }

      try {
        const c = await Contact.create({
          name: row["姓名"],
          phone: row["主要电话"],
          email: row["邮箱"] || "",
          other: row["其他信息"] || "",
          bookmark: row["书签"] === "是",
          contactMethods,
        });
        imported.push(c);
      } catch (e) {
        errors.push(`第 ${i + 2} 行保存失败：${e.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      imported: imported.length,
      errors,
      message: `成功导入 ${imported.length} 个联系人，${errors.length} 个错误`,
    });
  } catch (err) {
    console.error("POST /api/contacts_import error:", err);
    return res.status(500).json({ error: err.message });
  }
};
