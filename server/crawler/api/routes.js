const express = require('express');
const RecipeService = require('../services/recipeService');
const CronJobManager = require('../scheduler/cronJobs');
const { logger } = require('../utils/logger');

const router = express.Router();
const recipeService = new RecipeService();
const cronManager = new CronJobManager();

// 获取菜谱列表
router.get('/recipes', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      difficulty,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      difficulty,
      search,
      sortBy,
      sortOrder
    };

    const result = await recipeService.getAllRecipes(options);
    
    res.json({
      success: true,
      data: result.recipes,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('获取菜谱列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取菜谱列表失败',
      error: error.message
    });
  }
});

// 获取菜谱详情
router.get('/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await recipeService.getRecipeById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: '菜谱不存在'
      });
    }

    // 增加浏览次数
    await recipeService.incrementViewCount(id);

    res.json({
      success: true,
      data: recipe
    });

  } catch (error) {
    logger.error('获取菜谱详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取菜谱详情失败',
      error: error.message
    });
  }
});

// 获取推荐菜谱
router.get('/recipes/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recipes = await recipeService.getFeaturedRecipes(parseInt(limit));

    res.json({
      success: true,
      data: recipes
    });

  } catch (error) {
    logger.error('获取推荐菜谱失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐菜谱失败',
      error: error.message
    });
  }
});

// 获取分类统计
router.get('/categories/stats', async (req, res) => {
  try {
    const stats = await recipeService.getCategoryStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('获取分类统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类统计失败',
      error: error.message
    });
  }
});

// 更新菜谱评分
router.put('/recipes/:id/rating', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '评分必须在0-5之间'
      });
    }

    await recipeService.updateRecipeRating(id, rating);

    res.json({
      success: true,
      message: '评分更新成功'
    });

  } catch (error) {
    logger.error('更新菜谱评分失败:', error);
    res.status(500).json({
      success: false,
      message: '更新菜谱评分失败',
      error: error.message
    });
  }
});

// 手动执行爬虫任务
router.post('/crawl/manual', async (req, res) => {
  try {
    const { keywords = ['家常菜', '快手菜'] } = req.body;

    const result = await cronManager.runManualCrawl(keywords);

    res.json({
      success: true,
      message: '手动爬虫任务执行完成',
      data: result
    });

  } catch (error) {
    logger.error('手动爬虫任务失败:', error);
    res.status(500).json({
      success: false,
      message: '手动爬虫任务失败',
      error: error.message
    });
  }
});

// 获取爬虫状态
router.get('/crawl/status', async (req, res) => {
  try {
    const status = cronManager.getStatus();

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('获取爬虫状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取爬虫状态失败',
      error: error.message
    });
  }
});

// 健康检查
router.get('/health', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();

    res.json({
      success: true,
      message: '服务运行正常',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('健康检查失败:', error);
    res.status(500).json({
      success: false,
      message: '服务异常',
      error: error.message
    });
  }
});

// 获取爬取日志
router.get('/crawl/logs', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { pool } = require('../config/database');
    const connection = await pool.getConnection();

    try {
      // 获取总数
      const [countResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM crawl_logs'
      );
      const total = countResult[0].total;

      // 获取日志列表
      const [logs] = await connection.execute(`
        SELECT * FROM crawl_logs 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `, [parseInt(limit), offset]);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    logger.error('获取爬取日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取爬取日志失败',
      error: error.message
    });
  }
});

module.exports = router;
