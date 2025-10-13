-- 小红书菜谱爬虫数据库初始化脚本
-- 创建时间: 2024-01-01
-- 版本: 1.0.0

-- 创建数据库
CREATE DATABASE IF NOT EXISTS wife_menu 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE wife_menu;

-- 创建菜谱表
CREATE TABLE IF NOT EXISTS recipes (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '菜谱ID',
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 索引
  INDEX idx_category (category),
  INDEX idx_difficulty (difficulty),
  INDEX idx_rating (rating),
  INDEX idx_created_at (created_at),
  INDEX idx_is_featured (is_featured),
  INDEX idx_is_active (is_active),
  FULLTEXT idx_title_desc (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜谱表';

-- 创建分类表
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
  name VARCHAR(50) NOT NULL UNIQUE COMMENT '分类名称',
  icon VARCHAR(100) COMMENT '图标',
  description TEXT COMMENT '分类描述',
  sort_order INT DEFAULT 0 COMMENT '排序',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- 创建爬取日志表
CREATE TABLE IF NOT EXISTS crawl_logs (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  source VARCHAR(50) NOT NULL COMMENT '数据源',
  status ENUM('success', 'failed', 'partial', 'running') NOT NULL COMMENT '状态',
  total_count INT DEFAULT 0 COMMENT '总数量',
  success_count INT DEFAULT 0 COMMENT '成功数量',
  error_count INT DEFAULT 0 COMMENT '错误数量',
  error_message TEXT COMMENT '错误信息',
  start_time TIMESTAMP NOT NULL COMMENT '开始时间',
  end_time TIMESTAMP COMMENT '结束时间',
  duration INT COMMENT '耗时(秒)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  INDEX idx_source (source),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬取日志表';

-- 创建用户评分表
CREATE TABLE IF NOT EXISTS user_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '评分ID',
  recipe_id INT NOT NULL COMMENT '菜谱ID',
  user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
  rating DECIMAL(3,1) NOT NULL COMMENT '评分',
  comment TEXT COMMENT '评价内容',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  UNIQUE KEY uk_recipe_user (recipe_id, user_id),
  INDEX idx_recipe_id (recipe_id),
  INDEX idx_user_id (user_id),
  INDEX idx_rating (rating),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户评分表';

-- 创建收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '收藏ID',
  recipe_id INT NOT NULL COMMENT '菜谱ID',
  user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  UNIQUE KEY uk_recipe_user (recipe_id, user_id),
  INDEX idx_recipe_id (recipe_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';

-- 插入默认分类数据
INSERT IGNORE INTO categories (name, icon, description, sort_order) VALUES
('荤菜', '🥩', '肉类菜品，营养丰富', 1),
('素菜', '🥬', '蔬菜类菜品，健康清淡', 2),
('荤素搭配', '🥘', '荤素搭配菜品，营养均衡', 3),
('汤类', '🍲', '汤品，滋补养生', 4),
('甜品', '🍰', '甜品小食，甜蜜美味', 5),
('主食', '🍚', '米饭面条等主食', 6),
('凉菜', '🥗', '凉拌菜品，清爽开胃', 7),
('饮品', '🥤', '各种饮品制作', 8);

-- 创建视图：菜谱统计
CREATE OR REPLACE VIEW recipe_stats AS
SELECT 
  category,
  COUNT(*) as total_count,
  AVG(rating) as avg_rating,
  AVG(like_count) as avg_likes,
  AVG(view_count) as avg_views,
  MAX(created_at) as latest_recipe
FROM recipes 
WHERE is_active = 1
GROUP BY category
ORDER BY total_count DESC;

-- 创建视图：热门菜谱
CREATE OR REPLACE VIEW popular_recipes AS
SELECT 
  id,
  title,
  image_url,
  category,
  rating,
  like_count,
  view_count,
  created_at
FROM recipes 
WHERE is_active = 1 
  AND is_featured = 1
ORDER BY rating DESC, like_count DESC, view_count DESC
LIMIT 50;

-- 创建存储过程：更新菜谱评分
DELIMITER //
CREATE PROCEDURE UpdateRecipeRating(IN recipe_id INT, IN new_rating DECIMAL(3,1))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- 更新菜谱评分
  UPDATE recipes 
  SET rating = new_rating 
  WHERE id = recipe_id;
  
  -- 更新推荐状态
  UPDATE recipes 
  SET is_featured = (new_rating >= 4.0 AND like_count >= 10)
  WHERE id = recipe_id;
  
  COMMIT;
END //
DELIMITER ;

-- 创建存储过程：清理旧数据
DELIMITER //
CREATE PROCEDURE CleanupOldData(IN days_old INT)
BEGIN
  DECLARE affected_rows INT DEFAULT 0;
  
  -- 清理非推荐的低质量菜谱
  UPDATE recipes 
  SET is_active = 0 
  WHERE created_at < DATE_SUB(NOW(), INTERVAL days_old DAY) 
    AND is_featured = 0 
    AND like_count < 10
    AND rating < 3.0;
  
  SET affected_rows = ROW_COUNT();
  
  -- 返回清理的记录数
  SELECT affected_rows as cleaned_count;
END //
DELIMITER ;

-- 创建触发器：更新菜谱统计
DELIMITER //
CREATE TRIGGER tr_recipe_rating_update
AFTER UPDATE ON recipes
FOR EACH ROW
BEGIN
  IF OLD.rating != NEW.rating THEN
    -- 记录评分变更日志
    INSERT INTO crawl_logs (source, status, total_count, success_count, start_time, end_time)
    VALUES ('rating_update', 'success', 1, 1, NOW(), NOW());
  END IF;
END //
DELIMITER ;

-- 创建事件：每日数据统计
DELIMITER //
CREATE EVENT IF NOT EXISTS daily_stats
ON SCHEDULE EVERY 1 DAY
STARTS '2024-01-01 01:00:00'
DO
BEGIN
  -- 更新菜谱推荐状态
  UPDATE recipes 
  SET is_featured = (rating >= 4.0 AND like_count >= 10 AND view_count >= 50)
  WHERE is_active = 1;
  
  -- 记录统计日志
  INSERT INTO crawl_logs (source, status, total_count, success_count, start_time, end_time)
  VALUES ('daily_stats', 'success', 1, 1, NOW(), NOW());
END //
DELIMITER ;

-- 启用事件调度器
SET GLOBAL event_scheduler = ON;

-- 创建索引优化查询性能
CREATE INDEX idx_recipes_composite ON recipes (category, difficulty, is_active, rating);
CREATE INDEX idx_recipes_search ON recipes (title, description, tags);
CREATE INDEX idx_crawl_logs_time ON crawl_logs (created_at, source, status);

-- 插入示例数据（可选）
INSERT IGNORE INTO recipes (
  title, description, image_url, category, difficulty, cooking_time,
  servings, calories, ingredients, steps, tips, author, source_url, tags,
  rating, like_count, is_featured, is_active
) VALUES (
  '红烧肉',
  '经典家常菜，肥而不腻，入口即化',
  'https://example.com/hongshaorou.jpg',
  '荤菜',
  '中等',
  '30-45分钟',
  4,
  350,
  JSON_ARRAY(
    JSON_OBJECT('name', '五花肉', 'amount', '500g'),
    JSON_OBJECT('name', '生抽', 'amount', '2勺'),
    JSON_OBJECT('name', '老抽', 'amount', '1勺'),
    JSON_OBJECT('name', '冰糖', 'amount', '30g'),
    JSON_OBJECT('name', '料酒', 'amount', '2勺'),
    JSON_OBJECT('name', '葱', 'amount', '2根'),
    JSON_OBJECT('name', '姜', 'amount', '3片')
  ),
  JSON_ARRAY(
    JSON_OBJECT('step', 1, 'description', '五花肉切块，冷水下锅焯水'),
    JSON_OBJECT('step', 2, 'description', '热锅下油，放入冰糖炒糖色'),
    JSON_OBJECT('step', 3, 'description', '下入肉块翻炒上色'),
    JSON_OBJECT('step', 4, 'description', '加入调料和水，大火烧开转小火炖煮'),
    JSON_OBJECT('step', 5, 'description', '炖至肉烂汁浓即可')
  ),
  '炒糖色时火候要掌握好，不要炒糊了',
  '小红书用户',
  'https://www.xiaohongshu.com/explore/123456',
  JSON_ARRAY('红烧肉', '家常菜', '下饭菜'),
  4.5,
  128,
  TRUE,
  TRUE
);

-- 显示创建结果
SELECT 'Database initialization completed successfully!' as message;
SELECT COUNT(*) as recipe_count FROM recipes;
SELECT COUNT(*) as category_count FROM categories;
SELECT COUNT(*) as log_count FROM crawl_logs;
