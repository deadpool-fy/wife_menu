const cron = require('node-cron');
const XiaohongshuCrawler = require('../crawlers/xiaohongshu');
const RecipeService = require('../services/recipeService');
const { pool } = require('../config/database');
const { logger, crawlerLogger } = require('../utils/logger');

class CronJobManager {
  constructor() {
    this.recipeService = new RecipeService();
    this.isRunning = false;
  }

  // 启动所有定时任务
  startAllJobs() {
    logger.info('🚀 启动定时任务管理器...');

    // 每天零点执行爬虫任务
    this.startDailyCrawlJob();

    // 每周日凌晨2点清理旧数据
    this.startWeeklyCleanupJob();

    // 每小时检查数据库连接
    this.startHealthCheckJob();

    logger.info('✅ 所有定时任务已启动');
  }

  // 每日爬虫任务
  startDailyCrawlJob() {
    // 每天零点执行
    cron.schedule('0 0 * * *', async () => {
      if (this.isRunning) {
        logger.warn('⚠️ 爬虫任务正在运行中，跳过本次执行');
        return;
      }

      await this.runDailyCrawl();
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    });

    logger.info('📅 每日爬虫任务已设置: 每天 00:00 执行');
  }

  // 每周清理任务
  startWeeklyCleanupJob() {
    // 每周日凌晨2点执行
    cron.schedule('0 2 * * 0', async () => {
      await this.runWeeklyCleanup();
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    });

    logger.info('📅 每周清理任务已设置: 每周日 02:00 执行');
  }

  // 健康检查任务
  startHealthCheckJob() {
    // 每小时执行
    cron.schedule('0 * * * *', async () => {
      await this.runHealthCheck();
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    });

    logger.info('📅 健康检查任务已设置: 每小时执行');
  }

  // 执行每日爬虫任务
  async runDailyCrawl() {
    this.isRunning = true;
    const startTime = new Date();
    let logId = null;

    try {
      logger.info('🌅 开始执行每日爬虫任务...');

      // 记录爬取开始
      const connection = await pool.getConnection();
      const [result] = await connection.execute(`
        INSERT INTO crawl_logs (source, status, start_time) 
        VALUES ('xiaohongshu', 'running', ?)
      `, [startTime]);
      logId = result.insertId;
      connection.release();

      // 初始化爬虫
      const crawler = new XiaohongshuCrawler({
        headless: true,
        delay: 3000 // 增加延迟避免被封
      });

      await crawler.init();

      // 执行爬取
      const keywords = [
        '家常菜', '快手菜', '下饭菜', '汤品', '甜品',
        '素菜', '荤菜', '减肥餐', '营养餐', '儿童餐'
      ];

      const recipes = await crawler.crawlRecipes(keywords);
      await crawler.close();

      // 保存数据
      const saveResult = await this.recipeService.saveRecipes(recipes);

      // 更新爬取日志
      const endTime = new Date();
      const duration = Math.floor((endTime - startTime) / 1000);

      await this.updateCrawlLog(logId, {
        status: saveResult.failed > 0 ? 'partial' : 'success',
        totalCount: recipes.length,
        successCount: saveResult.success,
        errorCount: saveResult.failed,
        endTime,
        duration
      });

      logger.info(`🎉 每日爬虫任务完成: 耗时 ${duration}秒，成功 ${saveResult.success} 个，失败 ${saveResult.failed} 个`);

    } catch (error) {
      logger.error('❌ 每日爬虫任务失败:', error);

      // 更新错误日志
      if (logId) {
        const endTime = new Date();
        const duration = Math.floor((endTime - startTime) / 1000);
        
        await this.updateCrawlLog(logId, {
          status: 'failed',
          errorMessage: error.message,
          endTime,
          duration
        });
      }
    } finally {
      this.isRunning = false;
    }
  }

  // 执行每周清理任务
  async runWeeklyCleanup() {
    try {
      logger.info('🧹 开始执行每周清理任务...');

      const cleanedCount = await this.recipeService.cleanupOldData(30);
      
      logger.info(`✅ 每周清理任务完成: 清理了 ${cleanedCount} 个旧菜谱`);

    } catch (error) {
      logger.error('❌ 每周清理任务失败:', error);
    }
  }

  // 执行健康检查
  async runHealthCheck() {
    try {
      // 检查数据库连接
      const connection = await pool.getConnection();
      await connection.execute('SELECT 1');
      connection.release();

      // 检查爬虫状态
      const isHealthy = !this.isRunning;
      
      if (!isHealthy) {
        logger.warn('⚠️ 爬虫任务运行时间过长，可能存在异常');
      }

      logger.debug('💚 健康检查通过');

    } catch (error) {
      logger.error('❌ 健康检查失败:', error);
    }
  }

  // 更新爬取日志
  async updateCrawlLog(logId, data) {
    const connection = await pool.getConnection();
    
    try {
      const updateFields = [];
      const values = [];

      if (data.status) {
        updateFields.push('status = ?');
        values.push(data.status);
      }

      if (data.totalCount !== undefined) {
        updateFields.push('total_count = ?');
        values.push(data.totalCount);
      }

      if (data.successCount !== undefined) {
        updateFields.push('success_count = ?');
        values.push(data.successCount);
      }

      if (data.errorCount !== undefined) {
        updateFields.push('error_count = ?');
        values.push(data.errorCount);
      }

      if (data.errorMessage) {
        updateFields.push('error_message = ?');
        values.push(data.errorMessage);
      }

      if (data.endTime) {
        updateFields.push('end_time = ?');
        values.push(data.endTime);
      }

      if (data.duration !== undefined) {
        updateFields.push('duration = ?');
        values.push(data.duration);
      }

      if (updateFields.length > 0) {
        values.push(logId);
        await connection.execute(
          `UPDATE crawl_logs SET ${updateFields.join(', ')} WHERE id = ?`,
          values
        );
      }
    } finally {
      connection.release();
    }
  }

  // 手动执行爬虫任务
  async runManualCrawl(keywords = ['家常菜', '快手菜']) {
    if (this.isRunning) {
      throw new Error('爬虫任务正在运行中，请稍后再试');
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      logger.info('🔧 开始执行手动爬虫任务...');

      const crawler = new XiaohongshuCrawler({
        headless: false, // 手动执行时显示浏览器
        delay: 2000
      });

      await crawler.init();
      const recipes = await crawler.crawlRecipes(keywords);
      await crawler.close();

      const saveResult = await this.recipeService.saveRecipes(recipes);

      const duration = Math.floor((new Date() - startTime) / 1000);
      logger.info(`🎉 手动爬虫任务完成: 耗时 ${duration}秒，成功 ${saveResult.success} 个，失败 ${saveResult.failed} 个`);

      return {
        success: saveResult.success,
        failed: saveResult.failed,
        duration,
        recipes: recipes.length
      };

    } catch (error) {
      logger.error('❌ 手动爬虫任务失败:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // 获取任务状态
  getStatus() {
    return {
      isRunning: this.isRunning,
      timestamp: new Date().toISOString()
    };
  }

  // 停止所有任务
  stopAllJobs() {
    cron.destroy();
    logger.info('🛑 所有定时任务已停止');
  }
}

module.exports = CronJobManager;
