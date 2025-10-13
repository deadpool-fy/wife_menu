const { logger } = require('./logger');

class RetryManager {
  constructor(options = {}) {
    this.defaultOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true,
      retryCondition: this.defaultRetryCondition
    };
    
    this.options = { ...this.defaultOptions, ...options };
  }

  // 默认重试条件
  defaultRetryCondition(error) {
    // 网络错误
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ENOTFOUND' || 
        error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // 5xx服务器错误
    if (error.statusCode >= 500) {
      return true;
    }
    
    // 429频率限制
    if (error.statusCode === 429) {
      return true;
    }
    
    // 爬虫特定错误
    if (error.message.includes('timeout') || 
        error.message.includes('network') ||
        error.message.includes('connection')) {
      return true;
    }
    
    return false;
  }

  // 计算重试延迟
  calculateDelay(attempt) {
    let delay = this.options.baseDelay * Math.pow(this.options.backoffFactor, attempt - 1);
    
    // 限制最大延迟
    delay = Math.min(delay, this.options.maxDelay);
    
    // 添加随机抖动
    if (this.options.jitter) {
      const jitter = Math.random() * 0.1 * delay;
      delay += jitter;
    }
    
    return Math.floor(delay);
  }

  // 执行重试
  async execute(fn, context = {}) {
    let lastError;
    const startTime = Date.now();
    
    for (let attempt = 1; attempt <= this.options.maxRetries + 1; attempt++) {
      try {
        const result = await fn();
        
        if (attempt > 1) {
          logger.info(`重试成功 (尝试 ${attempt}/${this.options.maxRetries + 1}):`, {
            context,
            duration: Date.now() - startTime
          });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // 检查是否应该重试
        if (attempt > this.options.maxRetries || !this.options.retryCondition(error)) {
          break;
        }
        
        const delay = this.calculateDelay(attempt);
        
        logger.warn(`操作失败，${delay}ms后重试 (尝试 ${attempt}/${this.options.maxRetries + 1}):`, {
          error: error.message,
          context,
          delay
        });
        
        await this.sleep(delay);
      }
    }
    
    // 所有重试都失败了
    logger.error(`重试失败，已达到最大重试次数:`, {
      error: lastError.message,
      context,
      totalAttempts: this.options.maxRetries + 1,
      duration: Date.now() - startTime
    });
    
    throw lastError;
  }

  // 睡眠函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 创建重试包装器
  wrap(fn, options = {}) {
    const retryOptions = { ...this.options, ...options };
    const retryManager = new RetryManager(retryOptions);
    
    return async (...args) => {
      return await retryManager.execute(() => fn(...args), { args });
    };
  }

  // 批量重试
  async executeBatch(functions, options = {}) {
    const batchOptions = { ...this.options, ...options };
    const results = [];
    const errors = [];
    
    for (let i = 0; i < functions.length; i++) {
      try {
        const result = await this.execute(functions[i], { batchIndex: i });
        results.push({ index: i, success: true, result });
      } catch (error) {
        errors.push({ index: i, success: false, error });
        results.push({ index: i, success: false, error });
      }
    }
    
    return {
      results,
      errors,
      successCount: results.filter(r => r.success).length,
      errorCount: errors.length,
      totalCount: functions.length
    };
  }

  // 指数退避重试
  static exponentialBackoff(options = {}) {
    return new RetryManager({
      ...options,
      backoffFactor: 2
    });
  }

  // 线性重试
  static linear(options = {}) {
    return new RetryManager({
      ...options,
      backoffFactor: 1
    });
  }

  // 固定延迟重试
  static fixedDelay(delay, options = {}) {
    return new RetryManager({
      ...options,
      baseDelay: delay,
      backoffFactor: 1
    });
  }
}

// 创建默认重试管理器
const defaultRetryManager = new RetryManager();

// 数据库操作重试
const dbRetryManager = new RetryManager({
  maxRetries: 3,
  baseDelay: 1000,
  retryCondition: (error) => {
    return error.code && (
      error.code.startsWith('ER_') ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT'
    );
  }
});

// 网络请求重试
const networkRetryManager = new RetryManager({
  maxRetries: 5,
  baseDelay: 2000,
  retryCondition: (error) => {
    return error.code === 'ECONNREFUSED' ||
           error.code === 'ENOTFOUND' ||
           error.code === 'ETIMEDOUT' ||
           error.statusCode >= 500 ||
           error.statusCode === 429;
  }
});

// 爬虫操作重试
const crawlerRetryManager = new RetryManager({
  maxRetries: 3,
  baseDelay: 5000,
  retryCondition: (error) => {
    return error.message.includes('timeout') ||
           error.message.includes('network') ||
           error.message.includes('connection') ||
           error.message.includes('puppeteer');
  }
});

module.exports = {
  RetryManager,
  defaultRetryManager,
  dbRetryManager,
  networkRetryManager,
  crawlerRetryManager
};
