// 小程序错误处理工具
const config = require('./config.js');

class ErrorHandler {
  constructor() {
    this.errorTypes = {
      NETWORK_ERROR: 'NETWORK_ERROR',
      SERVER_ERROR: 'SERVER_ERROR',
      DATA_ERROR: 'DATA_ERROR',
      TIMEOUT_ERROR: 'TIMEOUT_ERROR',
      VALIDATION_ERROR: 'VALIDATION_ERROR',
      UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };
  }

  // 处理错误
  handleError(error, context = {}) {
    const errorInfo = this.analyzeError(error);
    
    // 记录错误日志
    this.logError(error, errorInfo, context);
    
    // 显示错误提示
    this.showErrorToast(errorInfo);
    
    return errorInfo;
  }

  // 分析错误类型
  analyzeError(error) {
    let errorType = this.errorTypes.UNKNOWN_ERROR;
    let message = '未知错误';
    let code = 0;

    // 网络错误
    if (error.errMsg && error.errMsg.includes('timeout')) {
      errorType = this.errorTypes.TIMEOUT_ERROR;
      message = config.error.timeoutError;
      code = -1;
    }
    else if (error.errMsg && error.errMsg.includes('fail')) {
      errorType = this.errorTypes.NETWORK_ERROR;
      message = config.error.networkError;
      code = -2;
    }
    // 服务器错误
    else if (error.statusCode >= 500) {
      errorType = this.errorTypes.SERVER_ERROR;
      message = config.error.serverError;
      code = error.statusCode;
    }
    // 数据错误
    else if (error.statusCode >= 400 && error.statusCode < 500) {
      errorType = this.errorTypes.DATA_ERROR;
      message = error.data?.message || config.error.dataError;
      code = error.statusCode;
    }
    // 自定义错误
    else if (error.message) {
      message = error.message;
      code = error.code || 0;
    }

    return {
      type: errorType,
      message,
      code,
      originalError: error,
      timestamp: new Date().toISOString()
    };
  }

  // 记录错误日志
  logError(error, errorInfo, context) {
    const logData = {
      errorType: errorInfo.type,
      message: errorInfo.message,
      code: errorInfo.code,
      context,
      stack: error.stack,
      timestamp: errorInfo.timestamp
    };

    console.error('小程序错误:', logData);
  }

  // 显示错误提示
  showErrorToast(errorInfo) {
    wx.showToast({
      title: errorInfo.message,
      icon: 'none',
      duration: 3000
    });
  }

  // 显示错误弹窗
  showErrorModal(errorInfo, callback) {
    wx.showModal({
      title: '错误提示',
      content: errorInfo.message,
      showCancel: false,
      confirmText: '确定',
      success: callback
    });
  }

  // 处理网络错误
  handleNetworkError(error, retryCallback) {
    const errorInfo = this.analyzeError(error);
    
    wx.showModal({
      title: '网络错误',
      content: '网络连接失败，是否重试？',
      confirmText: '重试',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm && retryCallback) {
          retryCallback();
        }
      }
    });
    
    return errorInfo;
  }

  // 处理数据错误
  handleDataError(error, fallbackCallback) {
    const errorInfo = this.analyzeError(error);
    
    if (fallbackCallback) {
      fallbackCallback();
    }
    
    return errorInfo;
  }

  // 处理超时错误
  handleTimeoutError(error, retryCallback) {
    const errorInfo = this.analyzeError(error);
    
    wx.showModal({
      title: '请求超时',
      content: '请求超时，是否重试？',
      confirmText: '重试',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm && retryCallback) {
          retryCallback();
        }
      }
    });
    
    return errorInfo;
  }

  // 处理验证错误
  handleValidationError(error) {
    const errorInfo = this.analyzeError(error);
    
    wx.showToast({
      title: errorInfo.message,
      icon: 'none',
      duration: 2000
    });
    
    return errorInfo;
  }

  // 处理未知错误
  handleUnknownError(error) {
    const errorInfo = this.analyzeError(error);
    
    wx.showModal({
      title: '系统错误',
      content: '系统出现未知错误，请稍后重试',
      showCancel: false,
      confirmText: '确定'
    });
    
    return errorInfo;
  }

  // 创建自定义错误
  createError(type, message, code = 0) {
    const error = new Error(message);
    error.type = type;
    error.code = code;
    return error;
  }

  // 验证错误
  createValidationError(message) {
    return this.createError(this.errorTypes.VALIDATION_ERROR, message, -100);
  }

  // 数据错误
  createDataError(message) {
    return this.createError(this.errorTypes.DATA_ERROR, message, -200);
  }

  // 网络错误
  createNetworkError(message) {
    return this.createError(this.errorTypes.NETWORK_ERROR, message, -300);
  }
}

// 创建错误处理实例
const errorHandler = new ErrorHandler();

module.exports = errorHandler;
