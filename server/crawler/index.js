const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection, initDatabase } = require('./config/database');
const { logger } = require('./utils/logger');
const CronJobManager = require('./scheduler/cronJobs');
const routes = require('./api/routes');

class CrawlerServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.ocrOnlyMode = String(process.env.OCR_ONLY_MODE || '').toLowerCase() === 'true';
    this.cronManager = this.ocrOnlyMode ? null : new CronJobManager();
  }

  // 初始化中间件
  initMiddleware() {
    // 安全中间件
    this.app.use(helmet());
    
    // CORS中间件
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
      credentials: true
    }));

    // 日志中间件
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim())
      }
    }));

    // 解析JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 静态文件
    this.app.use('/static', express.static('public'));
  }

  // 初始化路由
  initRoutes() {
    // API路由
    this.app.use('/api', routes);

    // 根路径
    this.app.get('/', (req, res) => {
      res.json({
        message: '小红书菜谱爬虫服务',
        version: '1.0.0',
        status: 'running',
        mode: this.ocrOnlyMode ? 'ocr-only' : 'full',
        timestamp: new Date().toISOString()
      });
    });

    // 404处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: '接口不存在'
      });
    });

    // 错误处理中间件
    this.app.use((error, req, res, next) => {
      logger.error('服务器错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : '未知错误'
      });
    });
  }

  // 初始化数据库
  async initDatabase() {
    if (this.ocrOnlyMode) {
      logger.info('OCR_ONLY_MODE ????????????');
      return;
    }

    try {
      logger.info('🔗 正在连接数据库...');
      
      const connected = await testConnection();
      if (!connected) {
        throw new Error('数据库连接失败');
      }

      logger.info('📊 正在初始化数据库表...');
      await initDatabase();
      
      logger.info('✅ 数据库初始化完成');
    } catch (error) {
      logger.error('❌ 数据库初始化失败:', error);
      throw error;
    }
  }

  // 启动定时任务
  startCronJobs() {
    if (this.ocrOnlyMode || !this.cronManager) {
      logger.info('OCR_ONLY_MODE ??????????');
      return;
    }

    try {
      this.cronManager.startAllJobs();
      logger.info('⏰ 定时任务已启动');
    } catch (error) {
      logger.error('❌ 定时任务启动失败:', error);
    }
  }

  // 启动服务器
  async start() {
    try {
      logger.info('🚀 正在启动小红书菜谱爬虫服务...');

      // 初始化中间件
      this.initMiddleware();

      // 初始化数据库
      await this.initDatabase();

      // 初始化路由
      this.initRoutes();

      // 启动定时任务
      this.startCronJobs();

      // 启动服务器
      this.app.listen(this.port, () => {
        logger.info(`🎉 服务器启动成功: http://localhost:${this.port}`);
        logger.info(`📚 API文档: http://localhost:${this.port}/api`);
        logger.info(`💚 健康检查: http://localhost:${this.port}/api/health`);
      });

      // 优雅关闭处理
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ 服务器启动失败:', error);
      process.exit(1);
    }
  }

  // 设置优雅关闭
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`📴 收到 ${signal} 信号，正在优雅关闭服务...`);

      try {
        // 停止定时任务
        this.cronManager.stopAllJobs();
        
        // 关闭数据库连接
        const { pool } = require('./config/database');
        await pool.end();
        
        logger.info('✅ 服务已优雅关闭');
        process.exit(0);
      } catch (error) {
        logger.error('❌ 关闭服务时出错:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// 启动服务器
if (require.main === module) {
  const server = new CrawlerServer();
  server.start().catch(error => {
    logger.error('❌ 启动失败:', error);
    process.exit(1);
  });
}

module.exports = CrawlerServer;
