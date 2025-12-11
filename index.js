const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const xlsx = require('xlsx');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/contactsdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 更新 Mongoose schema & model - 添加 bookmark 字段和联系方式数组
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  other: String,
  bookmark: { type: Boolean, default: false }, // 新增：书签功能
  contactMethods: [ // 新增：多种联系方式
    {
      type: { type: String, required: true }, // phone, email, wechat, address等
      value: { type: String, required: true },
      label: String // 标签：如"工作电话"、"家庭地址"
    }
  ]
});

const Contact = mongoose.model('Contact', contactSchema);

// Get contacts, support fuzzy search and sorting by name
app.get('/api/contacts', async (req, res) => {
  const { name, phone, bookmark } = req.query;
  let filter = {};
  if (name) filter.name = { $regex: name, $options: 'i' };
  if (phone) filter.phone = { $regex: phone, $options: 'i' };
  if (bookmark === 'true') filter.bookmark = true; // 书签筛选
  
  const contacts = await Contact.find(filter).sort({ name: 1 });
  res.json(contacts);
});

// Add contact (required name and phone)
app.post('/api/contacts', async (req, res) => {
  if (!req.body.name || !req.body.phone) {
    return res.status(400).json({ error: 'Name and Phone are required.' });
  }
  const contact = new Contact(req.body);
  await contact.save();
  res.json(contact);
});

// Update contact
app.put('/api/contacts/:id', async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(contact);
});

// Delete contact by id
app.delete('/api/contacts/:id', async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  res.json({ msg: 'Deleted' });
});

// Delete ALL contacts (Clear All)
app.delete('/api/contacts', async (req, res) => {
  await Contact.deleteMany({});
  res.json({ msg: 'All contacts cleared' });
});

// 新增：切换书签状态
app.patch('/api/contacts/:id/bookmark', async (req, res) => {
  const { bookmark } = req.body;
  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { bookmark },
    { new: true }
  );
  res.json(contact);
});

// 新增：导出为Excel
app.get('/api/contacts/export', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ name: 1 });
    
    // 准备Excel数据
    const data = contacts.map(contact => {
      const row = {
        '姓名': contact.name,
        '主要电话': contact.phone,
        '邮箱': contact.email || '',
        '其他信息': contact.other || '',
        '书签': contact.bookmark ? '是' : '否'
      };
      
      // 添加多种联系方式
      if (contact.contactMethods && contact.contactMethods.length > 0) {
        contact.contactMethods.forEach((method, index) => {
          row[`联系方式${index + 1}-类型`] = method.type;
          row[`联系方式${index + 1}-标签`] = method.label || '';
          row[`联系方式${index + 1}-值`] = method.value;
        });
      }
      
      return row;
    });
    
    // 创建Excel工作簿
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, '通讯录');
    
    // 设置列宽
    const wscols = [
      { wch: 15 }, // 姓名
      { wch: 15 }, // 主要电话
      { wch: 25 }, // 邮箱
      { wch: 30 }, // 其他信息
      { wch: 8 },  // 书签
    ];
    worksheet['!cols'] = wscols;
    
    // 生成Excel文件
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // 设置响应头
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);
    
  } catch (error) {
    console.error('导出失败:', error);
    res.status(500).json({ error: '导出失败' });
  }
});

// 新增：导入Excel
app.post('/api/contacts/import', async (req, res) => {
  try {
    const fileData = req.body.fileData;
    
    if (!fileData) {
      return res.status(400).json({ error: '未提供文件数据' });
    }
    
    // 从base64解码
    const buffer = Buffer.from(fileData, 'base64');
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    const importedContacts = [];
    const errors = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      if (!row['姓名'] || !row['主要电话']) {
        errors.push(`第${i + 2}行：姓名和主要电话为必填项`);
        continue;
      }
      
      const contactMethods = [];
      
      // 解析多种联系方式
      for (let j = 1; j <= 10; j++) {
        const typeKey = `联系方式${j}-类型`;
        const labelKey = `联系方式${j}-标签`;
        const valueKey = `联系方式${j}-值`;
        
        if (row[typeKey] && row[valueKey]) {
          contactMethods.push({
            type: row[typeKey],
            label: row[labelKey] || '',
            value: row[valueKey]
          });
        }
      }
      
      const contact = new Contact({
        name: row['姓名'],
        phone: row['主要电话'],
        email: row['邮箱'] || '',
        other: row['其他信息'] || '',
        bookmark: row['书签'] === '是',
        contactMethods: contactMethods
      });
      
      try {
        await contact.save();
        importedContacts.push(contact);
      } catch (saveError) {
        errors.push(`第${i + 2}行：保存失败 - ${saveError.message}`);
      }
    }
    
    res.json({
      success: true,
      imported: importedContacts.length,
      errors: errors,
      message: `成功导入 ${importedContacts.length} 个联系人，${errors.length} 个错误`
    });
    
  } catch (error) {
    console.error('导入失败:', error);
    res.status(500).json({ error: '导入失败', details: error.message });
  }
});

app.listen(5000, () => {
  console.log('Server started on http://localhost:5000');
});
