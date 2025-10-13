const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

class RecipeService {
  constructor() {
    this.tableName = 'recipes';
  }

  // 批量保存菜谱
  async saveRecipes(recipes) {
    if (!recipes || recipes.length === 0) {
      logger.warn('⚠️ 没有菜谱数据需要保存');
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const recipe of recipes) {
      try {
        await this.saveRecipe(recipe);
        successCount++;
        logger.info(`✅ 保存菜谱成功: ${recipe.title}`);
      } catch (error) {
        failedCount++;
        errors.push({ recipe: recipe.title, error: error.message });
        logger.error(`❌ 保存菜谱失败: ${recipe.title}`, error.message);
      }
    }

    logger.info(`📊 菜谱保存完成: 成功 ${successCount} 个，失败 ${failedCount} 个`);
    
    if (errors.length > 0) {
      logger.error('❌ 保存失败的菜谱:', errors);
    }

    return { success: successCount, failed: failedCount, errors };
  }

  // 保存单个菜谱
  async saveRecipe(recipe) {
    const connection = await pool.getConnection();
    
    try {
      // 检查是否已存在相同标题的菜谱
      const [existing] = await connection.execute(
        'SELECT id FROM recipes WHERE title = ? AND source_url = ?',
        [recipe.title, recipe.sourceUrl]
      );

      if (existing.length > 0) {
        logger.info(`🔄 菜谱已存在，跳过: ${recipe.title}`);
        return existing[0].id;
      }

      // 插入新菜谱
      const [result] = await connection.execute(`
        INSERT INTO recipes (
          title, description, image_url, category, difficulty, cooking_time,
          servings, calories, ingredients, steps, tips, author, source_url,
          tags, rating, view_count, like_count, is_featured, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        recipe.title,
        recipe.description,
        recipe.imageUrl,
        recipe.category,
        recipe.difficulty,
        recipe.cookingTime,
        recipe.servings,
        recipe.calories,
        JSON.stringify(recipe.ingredients),
        JSON.stringify(recipe.steps),
        recipe.tips,
        recipe.author,
        recipe.sourceUrl,
        JSON.stringify(recipe.tags),
        recipe.rating,
        recipe.viewCount,
        recipe.likeCount,
        recipe.isFeatured,
        recipe.isActive
      ]);

      logger.info(`✅ 菜谱保存成功: ${recipe.title} (ID: ${result.insertId})`);
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  // 获取所有菜谱
  async getAllRecipes(options = {}) {
    const {
      page = 1,
      limit = 20,
      category = null,
      difficulty = null,
      search = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    const connection = await pool.getConnection();
    
    try {
      let whereClause = 'WHERE is_active = 1';
      const params = [];

      if (category) {
        whereClause += ' AND category = ?';
        params.push(category);
      }

      if (difficulty) {
        whereClause += ' AND difficulty = ?';
        params.push(difficulty);
      }

      if (search) {
        whereClause += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      const offset = (page - 1) * limit;
      const orderBy = `ORDER BY ${sortBy} ${sortOrder}`;
      const limitClause = `LIMIT ${limit} OFFSET ${offset}`;

      // 获取总数
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM recipes ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      // 获取菜谱列表
      const [recipes] = await connection.execute(`
        SELECT 
          id, title, description, image_url, category, difficulty, 
          cooking_time, servings, calories, ingredients, steps, tips,
          author, source_url, tags, rating, view_count, like_count,
          is_featured, created_at, updated_at
        FROM recipes 
        ${whereClause} 
        ${orderBy} 
        ${limitClause}
      `, params);

      // 解析JSON字段
      const processedRecipes = recipes.map(recipe => ({
        ...recipe,
        ingredients: JSON.parse(recipe.ingredients || '[]'),
        steps: JSON.parse(recipe.steps || '[]'),
        tags: JSON.parse(recipe.tags || '[]')
      }));

      return {
        recipes: processedRecipes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } finally {
      connection.release();
    }
  }

  // 根据ID获取菜谱
  async getRecipeById(id) {
    const connection = await pool.getConnection();
    
    try {
      const [recipes] = await connection.execute(
        'SELECT * FROM recipes WHERE id = ? AND is_active = 1',
        [id]
      );

      if (recipes.length === 0) {
        return null;
      }

      const recipe = recipes[0];
      return {
        ...recipe,
        ingredients: JSON.parse(recipe.ingredients || '[]'),
        steps: JSON.parse(recipe.steps || '[]'),
        tags: JSON.parse(recipe.tags || '[]')
      };
    } finally {
      connection.release();
    }
  }

  // 获取推荐菜谱
  async getFeaturedRecipes(limit = 10) {
    const connection = await pool.getConnection();
    
    try {
      const [recipes] = await connection.execute(`
        SELECT 
          id, title, description, image_url, category, difficulty,
          cooking_time, servings, calories, rating, like_count,
          is_featured, created_at
        FROM recipes 
        WHERE is_active = 1 AND is_featured = 1
        ORDER BY rating DESC, like_count DESC, created_at DESC
        LIMIT ?
      `, [limit]);

      return recipes.map(recipe => ({
        ...recipe,
        ingredients: JSON.parse(recipe.ingredients || '[]'),
        steps: JSON.parse(recipe.steps || '[]'),
        tags: JSON.parse(recipe.tags || '[]')
      }));
    } finally {
      connection.release();
    }
  }

  // 获取分类统计
  async getCategoryStats() {
    const connection = await pool.getConnection();
    
    try {
      const [stats] = await connection.execute(`
        SELECT 
          category,
          COUNT(*) as count,
          AVG(rating) as avg_rating,
          AVG(like_count) as avg_likes
        FROM recipes 
        WHERE is_active = 1
        GROUP BY category
        ORDER BY count DESC
      `);

      return stats;
    } finally {
      connection.release();
    }
  }

  // 更新菜谱评分
  async updateRecipeRating(id, rating) {
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        'UPDATE recipes SET rating = ? WHERE id = ?',
        [rating, id]
      );
      
      logger.info(`✅ 菜谱评分更新成功: ID ${id}, 评分 ${rating}`);
    } finally {
      connection.release();
    }
  }

  // 增加浏览次数
  async incrementViewCount(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        'UPDATE recipes SET view_count = view_count + 1 WHERE id = ?',
        [id]
      );
    } finally {
      connection.release();
    }
  }

  // 删除菜谱
  async deleteRecipe(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        'UPDATE recipes SET is_active = 0 WHERE id = ?',
        [id]
      );
      
      logger.info(`✅ 菜谱已删除: ID ${id}`);
    } finally {
      connection.release();
    }
  }

  // 清理旧数据
  async cleanupOldData(days = 30) {
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute(`
        UPDATE recipes 
        SET is_active = 0 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY) 
        AND is_featured = 0 
        AND like_count < 10
      `, [days]);

      logger.info(`🧹 清理了 ${result.affectedRows} 个旧菜谱`);
      return result.affectedRows;
    } finally {
      connection.release();
    }
  }
}

module.exports = RecipeService;
