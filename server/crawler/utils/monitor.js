const { logger } = require('./logger');
const { pool } = require('../config/database');

class Monitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      success: 0,
      responseTime: [],
      memoryUsage: [],
      cpuUsage: [],
      databaseConnections: 0,
      crawlerTasks: 0,
      lastUpdate: new Date()
    };
    
    this.alerts = [];
    this.thresholds = {
      errorRate: 0.1, // 10%
      responseTime: 5000, // 5秒
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.8, // 80%
      databaseConnections: 10
    };
  }

  // 记录请求
  recordRequest(responseTime) {
    this.metrics.requests++;
    this.metrics.responseTime.push(responseTime);
    
    // 保持最近100个响应时间记录
    if (this.metrics.responseTime.length > 100) {
      this.metrics.responseTime.shift();
    }
    
    this.checkThresholds();
  }

  // 记录成功
  recordSuccess() {
    this.metrics.success++;
    this.metrics.lastUpdate = new Date();
  }

  // 记录错误
  recordError(error) {
    this.metrics.errors++;
    this.metrics.lastUpdate = new Date();
    
    // 记录错误详情
    this.logError(error);
  }

  // 记录内存使用
  recordMemoryUsage() {
    const usage = process.memoryUsage();
    const memoryUsage = usage.heapUsed / usage.heapTotal;
    
    this.metrics.memoryUsage.push(memoryUsage);
    
    // 保持最近50个内存使用记录
    if (this.metrics.memoryUsage.length > 50) {
      this.metrics.memoryUsage.shift();
    }
  }

  // 记录CPU使用
  recordCpuUsage() {
    const usage = process.cpuUsage();
    const cpuUsage = usage.user / 1000000; // 转换为秒
    
    this.metrics.cpuUsage.push(cpuUsage);
    
    // 保持最近50个CPU使用记录
    if (this.metrics.cpuUsage.length > 50) {
      this.metrics.cpuUsage.shift();
    }
  }

  // 记录数据库连接
  async recordDatabaseConnections() {
    try {
      const connection = await pool.getConnection();
      this.metrics.databaseConnections = pool._allConnections.length;
      connection.release();
    } catch (error) {
      logger.error('获取数据库连接数失败:', error);
    }
  }

  // 记录爬虫任务
  recordCrawlerTask(status) {
    if (status === 'start') {
      this.metrics.crawlerTasks++;
    } else if (status === 'end') {
      this.metrics.crawlerTasks = Math.max(0, this.metrics.crawlerTasks - 1);
    }
  }

  // 检查阈值
  checkThresholds() {
    const errorRate = this.getErrorRate();
    const avgResponseTime = this.getAverageResponseTime();
    const avgMemoryUsage = this.getAverageMemoryUsage();
    const avgCpuUsage = this.getAverageCpuUsage();
    
    // 检查错误率
    if (errorRate > this.thresholds.errorRate) {
      this.createAlert('error_rate', `错误率过高: ${(errorRate * 100).toFixed(2)}%`);
    }
    
    // 检查响应时间
    if (avgResponseTime > this.thresholds.responseTime) {
      this.createAlert('response_time', `响应时间过长: ${avgResponseTime}ms`);
    }
    
    // 检查内存使用
    if (avgMemoryUsage > this.thresholds.memoryUsage) {
      this.createAlert('memory_usage', `内存使用率过高: ${(avgMemoryUsage * 100).toFixed(2)}%`);
    }
    
    // 检查CPU使用
    if (avgCpuUsage > this.thresholds.cpuUsage) {
      this.createAlert('cpu_usage', `CPU使用率过高: ${(avgCpuUsage * 100).toFixed(2)}%`);
    }
    
    // 检查数据库连接
    if (this.metrics.databaseConnections > this.thresholds.databaseConnections) {
      this.createAlert('database_connections', `数据库连接数过多: ${this.metrics.databaseConnections}`);
    }
  }

  // 创建告警
  createAlert(type, message) {
    const alert = {
      type,
      message,
      timestamp: new Date(),
      level: 'warning'
    };
    
    // 检查是否已存在相同告警
    const existingAlert = this.alerts.find(a => 
      a.type === type && 
      (Date.now() - a.timestamp.getTime()) < 300000 // 5分钟内
    );
    
    if (!existingAlert) {
      this.alerts.push(alert);
      logger.warn(`🚨 系统告警 [${type}]:`, message);
      
      // 发送告警通知
      this.sendAlert(alert);
    }
  }

  // 发送告警通知
  sendAlert(alert) {
    // 这里可以集成邮件、短信、钉钉等告警方式
    logger.error('ALERT:', alert);
    
    // 示例：发送到日志文件
    const alertMessage = {
      level: 'ERROR',
      type: 'ALERT',
      timestamp: alert.timestamp.toISOString(),
      data: alert
    };
    
    logger.error('SYSTEM_ALERT:', alertMessage);
  }

  // 获取错误率
  getErrorRate() {
    if (this.metrics.requests === 0) return 0;
    return this.metrics.errors / this.metrics.requests;
  }

  // 获取平均响应时间
  getAverageResponseTime() {
    if (this.metrics.responseTime.length === 0) return 0;
    return this.metrics.responseTime.reduce((sum, time) => sum + time, 0) / this.metrics.responseTime.length;
  }

  // 获取平均内存使用
  getAverageMemoryUsage() {
    if (this.metrics.memoryUsage.length === 0) return 0;
    return this.metrics.memoryUsage.reduce((sum, usage) => sum + usage, 0) / this.metrics.memoryUsage.length;
  }

  // 获取平均CPU使用
  getAverageCpuUsage() {
    if (this.metrics.cpuUsage.length === 0) return 0;
    return this.metrics.cpuUsage.reduce((sum, usage) => sum + usage, 0) / this.metrics.cpuUsage.length;
  }

  // 获取系统状态
  getSystemStatus() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      arch: process.arch
    };
  }

  // 获取指标摘要
  getMetricsSummary() {
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      success: this.metrics.success,
      errorRate: this.getErrorRate(),
      avgResponseTime: this.getAverageResponseTime(),
      avgMemoryUsage: this.getAverageMemoryUsage(),
      avgCpuUsage: this.getAverageCpuUsage(),
      databaseConnections: this.metrics.databaseConnections,
      crawlerTasks: this.metrics.crawlerTasks,
      alerts: this.alerts.length,
      lastUpdate: this.metrics.lastUpdate
    };
  }

  // 获取健康状态
  getHealthStatus() {
    const errorRate = this.getErrorRate();
    const avgResponseTime = this.getAverageResponseTime();
    const avgMemoryUsage = this.getAverageMemoryUsage();
    
    let status = 'healthy';
    let issues = [];
    
    if (errorRate > 0.05) {
      status = 'unhealthy';
      issues.push('高错误率');
    }
    
    if (avgResponseTime > 3000) {
      status = 'unhealthy';
      issues.push('响应时间过长');
    }
    
    if (avgMemoryUsage > 0.9) {
      status = 'unhealthy';
      issues.push('内存使用率过高');
    }
    
    if (this.metrics.databaseConnections > 8) {
      status = 'unhealthy';
      issues.push('数据库连接数过多');
    }
    
    return {
      status,
      issues,
      timestamp: new Date()
    };
  }

  // 清理旧告警
  cleanupAlerts() {
    const fiveMinutesAgo = new Date(Date.now() - 300000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > fiveMinutesAgo);
  }

  // 重置指标
  resetMetrics() {
    this.metrics = {
      requests: 0,
      errors: 0,
      success: 0,
      responseTime: [],
      memoryUsage: [],
      cpuUsage: [],
      databaseConnections: 0,
      crawlerTasks: 0,
      lastUpdate: new Date()
    };
    
    this.alerts = [];
  }

  // 定期更新指标
  startMonitoring() {
    // 每30秒更新一次系统指标
    setInterval(() => {
      this.recordMemoryUsage();
      this.recordCpuUsage();
      this.recordDatabaseConnections();
      this.cleanupAlerts();
    }, 30000);
    
    logger.info('监控系统已启动');
  }

  // 停止监控
  stopMonitoring() {
    logger.info('监控系统已停止');
  }
}

// 创建监控实例
const monitor = new Monitor();

// 启动监控
monitor.startMonitoring();

module.exports = monitor;
