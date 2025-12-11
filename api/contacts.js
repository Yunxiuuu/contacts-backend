const express = require("express");
const router = express.Router();
const { getDbConfig } = require("../db");
const { Client } = require('pg');

// 获取所有联系人
router.get("/", async (req, res) => {
  const client = new Client(getDbConfig());
  
  try {
    await client.connect();
    const result = await client.query("SELECT * FROM contacts ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.end();
  }
});

// 其他路由也按照同样方式修改...
// 在每个路由中都需要重新创建数据库连接
