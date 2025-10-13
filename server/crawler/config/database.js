const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wife_menu',
  charset: 'utf8mb4',
  timezone: '+08:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// 创建连接池
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 初始化数据库表
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // 创建菜谱表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL COMMENT '菜谱标题',
        description TEXT COMMENT '菜谱描述',
        image_url VARCHAR(500) COMMENT '图片URL',
        category VARCHAR(50) COMMENT '分类',
        difficulty VARCHAR(20) COMMENT '难度',
        cooking_time VARCHAR(50) COMMENT '制作时间',
        servings INT COMMENT '适合人数',
        calories INT COMMENT '卡路里',
        ingredients JSON COMMENT '食材清单',
        steps JSON COMMENT '制作步骤',
        tips TEXT COMMENT '小贴士',
        author VARCHAR(100) COMMENT '作者',
        source_url VARCHAR(500) COMMENT '来源链接',
        tags JSON COMMENT '标签',
        rating DECIMAL(3,1) DEFAULT 0 COMMENT '评分',
        view_count INT DEFAULT 0 COMMENT '浏览次数',
        like_count INT DEFAULT 0 COMMENT '点赞数',
        is_featured BOOLEAN DEFAULT FALSE COMMENT '是否推荐',
        is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_difficulty (difficulty),
        INDEX idx_rating (rating),
        INDEX idx_created_at (created_at),
        FULLTEXT idx_title_desc (title, description)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建分类表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE COMMENT '分类名称',
        icon VARCHAR(100) COMMENT '图标',
        description TEXT COMMENT '分类描述',
        sort_order INT DEFAULT 0 COMMENT '排序',
        is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建爬取日志表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS crawl_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source VARCHAR(50) NOT NULL COMMENT '数据源',
        status ENUM('success', 'failed', 'partial') NOT NULL COMMENT '状态',
        total_count INT DEFAULT 0 COMMENT '总数量',
        success_count INT DEFAULT 0 COMMENT '成功数量',
        error_count INT DEFAULT 0 COMMENT '错误数量',
        error_message TEXT COMMENT '错误信息',
        start_time TIMESTAMP NOT NULL COMMENT '开始时间',
        end_time TIMESTAMP COMMENT '结束时间',
        duration INT COMMENT '耗时(秒)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 插入默认分类
    await connection.execute(`
      INSERT IGNORE INTO categories (name, icon, description, sort_order) VALUES
      ('荤菜', '🥩', '肉类菜品', 1),
      ('素菜', '🥬', '蔬菜类菜品', 2),
      ('荤素搭配', '🥘', '荤素搭配菜品', 3),
      ('汤类', '🍲', '汤品', 4),
      ('甜品', '🍰', '甜品小食', 5),
      ('主食', '🍚', '米饭面条等主食', 6)
    `);

    console.log('✅ 数据库表初始化完成');
    connection.release();
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection,
  initDatabase
};
