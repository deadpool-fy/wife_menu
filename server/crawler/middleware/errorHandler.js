const { logger } = require('../utils/logger');

class ErrorHandler {
  constructor() {
    this.errorTypes = {
      VALIDATION_ERROR: 'VALIDATION_ERROR',
      DATABASE_ERROR: 'DATABASE_ERROR',
      NETWORK_ERROR: 'NETWORK_ERROR',
      CRAWLER_ERROR: 'CRAWLER_ERROR',
      AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
      AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
      RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
      UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };
  }

  // 处理错误
  handleError(error, req, res, next) {
    const errorInfo = this.analyzeError(error);
    
    // 记录错误日志
    this.logError(error, errorInfo, req);
    
    // 返回错误响应
    this.sendErrorResponse(res, errorInfo);
  }

  // 分析错误类型
  analyzeError(error) {
    let errorType = this.errorTypes.UNKNOWN_ERROR;
    let statusCode = 500;
    let message = '服务器内部错误';
    let details = null;

    // 数据库错误
    if (error.code && error.code.startsWith('ER_')) {
      errorType = this.errorTypes.DATABASE_ERROR;
      statusCode = 500;
      message = '数据库操作失败';
      details = this.getDatabaseErrorDetails(error);
    }
    
    // 连接错误
    else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorType = this.errorTypes.NETWORK_ERROR;
      statusCode = 503;
      message = '服务暂时不可用';
    }
    
    // 超时错误
    else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorType = this.errorTypes.NETWORK_ERROR;
      statusCode = 504;
      message = '请求超时';
    }
    
    // 验证错误
    else if (error.name === 'ValidationError' || error.isJoi) {
      errorType = this.errorTypes.VALIDATION_ERROR;
      statusCode = 400;
      message = '数据验证失败';
      details = this.getValidationErrorDetails(error);
    }
    
    // 爬虫错误
    else if (error.message.includes('crawler') || error.message.includes('puppeteer')) {
      errorType = this.errorTypes.CRAWLER_ERROR;
      statusCode = 500;
      message = '爬虫服务异常';
    }
    
    // 权限错误
    else if (error.status === 401) {
      errorType = this.errorTypes.AUTHENTICATION_ERROR;
      statusCode = 401;
      message = '未授权访问';
    }
    else if (error.status === 403) {
      errorType = this.errorTypes.AUTHORIZATION_ERROR;
      statusCode = 403;
      message = '权限不足';
    }
    
    // 频率限制错误
    else if (error.status === 429) {
      errorType = this.errorTypes.RATE_LIMIT_ERROR;
      statusCode = 429;
      message = '请求过于频繁';
    }
    
    // 自定义错误
    else if (error.statusCode) {
      statusCode = error.statusCode;
      message = error.message || message;
    }

    return {
      type: errorType,
      statusCode,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    };
  }

  // 获取数据库错误详情
  getDatabaseErrorDetails(error) {
    const errorMap = {
      'ER_DUP_ENTRY': '数据重复，请检查唯一性约束',
      'ER_NO_REFERENCED_ROW_2': '外键约束失败，引用的数据不存在',
      'ER_ROW_IS_REFERENCED_2': '数据被其他记录引用，无法删除',
      'ER_DATA_TOO_LONG': '数据长度超过限制',
      'ER_BAD_NULL_ERROR': '必填字段不能为空',
      'ER_NO_SUCH_TABLE': '数据表不存在',
      'ER_ACCESS_DENIED_ERROR': '数据库访问被拒绝'
    };

    return {
      code: error.code,
      sqlMessage: error.sqlMessage,
      friendlyMessage: errorMap[error.code] || '数据库操作失败',
      sql: error.sql ? error.sql.substring(0, 200) + '...' : null
    };
  }

  // 获取验证错误详情
  getValidationErrorDetails(error) {
    if (error.details) {
      return error.details.map(detail => ({
        field: detail.path ? detail.path.join('.') : 'unknown',
        message: detail.message,
        value: detail.context ? detail.context.value : null
      }));
    }
    
    return [{
      field: 'unknown',
      message: error.message,
      value: null
    }];
  }

  // 记录错误日志
  logError(error, errorInfo, req) {
    const logData = {
      errorType: errorInfo.type,
      statusCode: errorInfo.statusCode,
      message: errorInfo.message,
      details: errorInfo.details,
      stack: error.stack,
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params
      },
      timestamp: errorInfo.timestamp,
      requestId: errorInfo.requestId
    };

    // 根据错误类型选择日志级别
    if (errorInfo.statusCode >= 500) {
      logger.error('服务器错误:', logData);
    } else if (errorInfo.statusCode >= 400) {
      logger.warn('客户端错误:', logData);
    } else {
      logger.info('处理错误:', logData);
    }
  }

  // 发送错误响应
  sendErrorResponse(res, errorInfo) {
    const response = {
      success: false,
      error: {
        type: errorInfo.type,
        message: errorInfo.message,
        timestamp: errorInfo.timestamp,
        requestId: errorInfo.requestId
      }
    };

    // 在开发环境下包含详细信息
    if (process.env.NODE_ENV === 'development') {
      response.error.details = errorInfo.details;
      response.error.stack = errorInfo.stack;
    }

    res.status(errorInfo.statusCode).json(response);
  }

  // 处理未捕获的异常
  handleUncaughtException() {
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // 优雅关闭
      process.exit(1);
    });
  }

  // 处理未处理的Promise拒绝
  handleUnhandledRejection() {
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝:', {
        reason: reason,
        promise: promise,
        timestamp: new Date().toISOString()
      });
      
      // 优雅关闭
      process.exit(1);
    });
  }

  // 创建自定义错误
  createError(type, message, statusCode = 500, details = null) {
    const error = new Error(message);
    error.type = type;
    error.statusCode = statusCode;
    error.details = details;
    return error;
  }

  // 验证错误
  createValidationError(message, details = null) {
    return this.createError(
      this.errorTypes.VALIDATION_ERROR,
      message,
      400,
      details
    );
  }

  // 数据库错误
  createDatabaseError(message, details = null) {
    return this.createError(
      this.errorTypes.DATABASE_ERROR,
      message,
      500,
      details
    );
  }

  // 网络错误
  createNetworkError(message, details = null) {
    return this.createError(
      this.errorTypes.NETWORK_ERROR,
      message,
      503,
      details
    );
  }

  // 爬虫错误
  createCrawlerError(message, details = null) {
    return this.createError(
      this.errorTypes.CRAWLER_ERROR,
      message,
      500,
      details
    );
  }

  // 初始化错误处理
  init() {
    this.handleUncaughtException();
    this.handleUnhandledRejection();
    
    logger.info('错误处理中间件已初始化');
  }
}

// 创建错误处理实例
const errorHandler = new ErrorHandler();

// 初始化错误处理
errorHandler.init();

module.exports = errorHandler;
