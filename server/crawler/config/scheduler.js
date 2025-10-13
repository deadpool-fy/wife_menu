const cron = require('node-cron');
const { logger } = require('../utils/logger');

class SchedulerConfig {
  constructor() {
    this.jobs = new Map();
    this.timezone = 'Asia/Shanghai';
  }

  // 获取所有定时任务配置
  getJobConfigs() {
    return {
      // 每日爬虫任务 - 每天零点执行
      dailyCrawl: {
        schedule: '0 0 * * *',
        timezone: this.timezone,
        enabled: true,
        description: '每日零点自动爬取小红书菜谱数据',
        retryCount: 3,
        retryDelay: 300000, // 5分钟
        timeout: 3600000, // 1小时
        onSuccess: this.onCrawlSuccess.bind(this),
        onError: this.onCrawlError.bind(this)
      },

      // 每周数据清理 - 每周日凌晨2点执行
      weeklyCleanup: {
        schedule: '0 2 * * 0',
        timezone: this.timezone,
        enabled: true,
        description: '每周清理30天前的旧数据',
        retryCount: 2,
        retryDelay: 600000, // 10分钟
        timeout: 1800000, // 30分钟
        onSuccess: this.onCleanupSuccess.bind(this),
        onError: this.onCleanupError.bind(this)
      },

      // 健康检查 - 每小时执行
      healthCheck: {
        schedule: '0 * * * *',
        timezone: this.timezone,
        enabled: true,
        description: '每小时检查服务健康状态',
        retryCount: 1,
        retryDelay: 300000, // 5分钟
        timeout: 60000, // 1分钟
        onSuccess: this.onHealthCheckSuccess.bind(this),
        onError: this.onHealthCheckError.bind(this)
      },

      // 数据统计 - 每天凌晨3点执行
      dailyStats: {
        schedule: '0 3 * * *',
        timezone: this.timezone,
        enabled: true,
        description: '每日数据统计和推荐更新',
        retryCount: 2,
        retryDelay: 300000, // 5分钟
        timeout: 900000, // 15分钟
        onSuccess: this.onStatsSuccess.bind(this),
        onError: this.onStatsError.bind(this)
      },

      // 数据备份 - 每天凌晨4点执行
      dailyBackup: {
        schedule: '0 4 * * *',
        timezone: this.timezone,
        enabled: process.env.NODE_ENV === 'production',
        description: '每日数据备份',
        retryCount: 1,
        retryDelay: 600000, // 10分钟
        timeout: 1800000, // 30分钟
        onSuccess: this.onBackupSuccess.bind(this),
        onError: this.onBackupError.bind(this)
      }
    };
  }

  // 获取任务执行时间表
  getScheduleInfo() {
    return {
      dailyCrawl: {
        nextRun: this.getNextRunTime('0 0 * * *'),
        frequency: '每天',
        time: '00:00',
        description: '爬取小红书最新菜谱数据'
      },
      weeklyCleanup: {
        nextRun: this.getNextRunTime('0 2 * * 0'),
        frequency: '每周',
        time: '周日 02:00',
        description: '清理30天前的旧数据'
      },
      healthCheck: {
        nextRun: this.getNextRunTime('0 * * * *'),
        frequency: '每小时',
        time: '每小时的00分',
        description: '检查服务健康状态'
      },
      dailyStats: {
        nextRun: this.getNextRunTime('0 3 * * *'),
        frequency: '每天',
        time: '03:00',
        description: '更新数据统计和推荐'
      },
      dailyBackup: {
        nextRun: this.getNextRunTime('0 4 * * *'),
        frequency: '每天',
        time: '04:00',
        description: '备份重要数据'
      }
    };
  }

  // 计算下次执行时间
  getNextRunTime(cronExpression) {
    try {
      const task = cron.schedule(cronExpression, () => {}, { scheduled: false });
      const nextDate = task.nextDate();
      task.destroy();
      return nextDate ? nextDate.toISOString() : null;
    } catch (error) {
      logger.error('计算下次执行时间失败:', error);
      return null;
    }
  }

  // 任务成功回调
  onCrawlSuccess(result) {
    logger.info('✅ 每日爬虫任务执行成功:', {
      successCount: result.success,
      failedCount: result.failed,
      duration: result.duration
    });
  }

  onCleanupSuccess(result) {
    logger.info('✅ 数据清理任务执行成功:', {
      cleanedCount: result.cleanedCount
    });
  }

  onHealthCheckSuccess(result) {
    logger.debug('✅ 健康检查通过:', result);
  }

  onStatsSuccess(result) {
    logger.info('✅ 数据统计任务执行成功:', result);
  }

  onBackupSuccess(result) {
    logger.info('✅ 数据备份任务执行成功:', result);
  }

  // 任务失败回调
  onCrawlError(error, jobName) {
    logger.error(`❌ 每日爬虫任务执行失败 (${jobName}):`, error);
    
    // 发送告警通知
    this.sendAlert('crawl_error', {
      job: jobName,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  onCleanupError(error, jobName) {
    logger.error(`❌ 数据清理任务执行失败 (${jobName}):`, error);
    
    this.sendAlert('cleanup_error', {
      job: jobName,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  onHealthCheckError(error, jobName) {
    logger.error(`❌ 健康检查失败 (${jobName}):`, error);
    
    this.sendAlert('health_check_error', {
      job: jobName,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  onStatsError(error, jobName) {
    logger.error(`❌ 数据统计任务执行失败 (${jobName}):`, error);
  }

  onBackupError(error, jobName) {
    logger.error(`❌ 数据备份任务执行失败 (${jobName}):`, error);
    
    this.sendAlert('backup_error', {
      job: jobName,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  // 发送告警通知
  sendAlert(type, data) {
    // 这里可以集成邮件、短信、钉钉等告警方式
    logger.warn(`🚨 系统告警 [${type}]:`, data);
    
    // 示例：发送到日志文件
    const alertMessage = {
      type,
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      data
    };
    
    logger.error('ALERT:', alertMessage);
  }

  // 获取任务状态
  getJobStatus() {
    const status = {};
    
    for (const [jobName, job] of this.jobs) {
      status[jobName] = {
        running: job.running || false,
        lastRun: job.lastRun || null,
        nextRun: job.nextRun || null,
        successCount: job.successCount || 0,
        errorCount: job.errorCount || 0,
        lastError: job.lastError || null
      };
    }
    
    return status;
  }

  // 更新任务状态
  updateJobStatus(jobName, status) {
    if (!this.jobs.has(jobName)) {
      this.jobs.set(jobName, {});
    }
    
    const job = this.jobs.get(jobName);
    Object.assign(job, status);
    this.jobs.set(jobName, job);
  }

  // 获取任务统计
  getJobStatistics() {
    const stats = {
      totalJobs: this.jobs.size,
      runningJobs: 0,
      successRate: 0,
      totalSuccess: 0,
      totalErrors: 0
    };
    
    for (const [jobName, job] of this.jobs) {
      if (job.running) stats.runningJobs++;
      if (job.successCount) stats.totalSuccess += job.successCount;
      if (job.errorCount) stats.totalErrors += job.errorCount;
    }
    
    const totalRuns = stats.totalSuccess + stats.totalErrors;
    if (totalRuns > 0) {
      stats.successRate = (stats.totalSuccess / totalRuns * 100).toFixed(2);
    }
    
    return stats;
  }

  // 手动触发任务
  async triggerJob(jobName, params = {}) {
    try {
      logger.info(`🔧 手动触发任务: ${jobName}`);
      
      this.updateJobStatus(jobName, {
        running: true,
        lastRun: new Date().toISOString()
      });
      
      // 这里应该调用具体的任务执行函数
      // 实际实现中需要根据jobName调用对应的任务函数
      
      this.updateJobStatus(jobName, {
        running: false,
        successCount: (this.jobs.get(jobName)?.successCount || 0) + 1
      });
      
      logger.info(`✅ 手动任务执行完成: ${jobName}`);
      
    } catch (error) {
      this.updateJobStatus(jobName, {
        running: false,
        errorCount: (this.jobs.get(jobName)?.errorCount || 0) + 1,
        lastError: error.message
      });
      
      logger.error(`❌ 手动任务执行失败: ${jobName}`, error);
      throw error;
    }
  }

  // 暂停任务
  pauseJob(jobName) {
    if (this.jobs.has(jobName)) {
      const job = this.jobs.get(jobName);
      job.paused = true;
      this.jobs.set(jobName, job);
      logger.info(`⏸️ 任务已暂停: ${jobName}`);
    }
  }

  // 恢复任务
  resumeJob(jobName) {
    if (this.jobs.has(jobName)) {
      const job = this.jobs.get(jobName);
      job.paused = false;
      this.jobs.set(jobName, job);
      logger.info(`▶️ 任务已恢复: ${jobName}`);
    }
  }

  // 停止所有任务
  stopAllJobs() {
    for (const [jobName, job] of this.jobs) {
      job.running = false;
      job.paused = true;
      this.jobs.set(jobName, job);
    }
    
    logger.info('🛑 所有定时任务已停止');
  }
}

module.exports = SchedulerConfig;
