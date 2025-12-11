const { Client } = require('pg');

// 获取数据库配置
const getDbConfig = () => {
  // 如果是 Vercel 环境，使用 Vercel Postgres
  if (process.env.POSTGRES_URL) {
    return {
      connectionString: process.env.POSTGRES_URL,
      ssl: {
        rejectUnauthorized: false
      }
    };
  }
  
  // 本地开发环境
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'contacts_db',
    ssl: process.env.NODE_ENV === 'production'
  };
};

const createTables = async () => {
  const client = new Client(getDbConfig());
  
  try {
    await client.connect();
    
    // 创建联系人表
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Database tables created or already exist');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await client.end();
  }
};

// 导出配置和创建表函数
module.exports = {
  getDbConfig,
  createTables
};
