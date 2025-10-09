// cloudfunctions/sendMessage/index.js
// 云函数：发送微信订阅消息

const cloud = require('wx-server-sdk')

// 初始化云开发 - 确保权限正确配置
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
  traceUser: true
})

// 检查云函数权限
const db = cloud.database()

// 清理模板字段内容
function sanitizeTemplateValue(value) {
  if (!value) return ''
  
  // 移除换行符和特殊字符
  return value
    .replace(/[\r\n]/g, ' ')  // 替换换行符为空格
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '') // 只保留中文、英文、数字和空格
    .trim()
    .substring(0, 20) // 限制20字符
}

// 提取菜单内容
function extractMenuContent(message) {
  if (!message) return ''
  
  // 提取菜品名称，移除时间和其他信息
  const lines = message.split('\n')
  const dishLines = lines.filter(line => 
    line.trim() && 
    !line.includes('时间：') && 
    !line.includes('来自：') &&
    !line.includes('今天中午的菜单：')
  )
  
  // 提取菜品名称
  const dishes = dishLines
    .map(line => line.replace(/^\d+\.\s*/, '').trim()) // 移除序号
    .filter(dish => dish.length > 0)
    .slice(0, 2) // 最多取2个菜品
  
  return dishes.join(' ') || '今日菜单'
}

// 安全的JSON序列化函数
function safeStringify(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString()
    }
    return value
  }, 2)
}

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('=== 云函数开始执行 ===')
  console.log('接收到的参数:', safeStringify(event))
  
  const wxContext = cloud.getWXContext()
  console.log('微信上下文:', safeStringify(wxContext))
  
  try {
    const { message, targetUserId, templateId } = event
    
    // 参数验证
    if (!message) {
      console.log('消息内容为空')
      return {
        success: false,
        message: '消息内容不能为空'
      }
    }
    
    if (!templateId) {
      console.log('模板ID为空')
      return {
        success: false,
        message: '模板ID不能为空'
      }
    }
    
    console.log('开始构建模板消息数据')
    
    // 构建模板消息数据
    // 注意：订阅消息只能发送给当前调用云函数的用户
    // 如需发送给其他人，需要使用其他方式（如客服消息、统一服务消息等）
    const templateData = {
      touser: wxContext.OPENID, // 发送给当前用户（订阅消息限制）
      template_id: templateId,
      page: 'pages/index/index', // 点击消息跳转的页面
      data: {
        thing1: {
          value: sanitizeTemplateValue('已生成待确认菜谱') // 菜谱类型
        },
        time2: {
          value: sanitizeTemplateValue(new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })) // 菜谱日期
        },
        thing4: {
          value: sanitizeTemplateValue(extractMenuContent(message)) // 备注，提取菜单内容
        }
      },
      miniprogram_state: 'formal' // 正式版
    }
    
    console.log('模板消息数据:', safeStringify(templateData))
    
    // 发送订阅消息
    console.log('开始发送订阅消息')
    
    try {
      const result = await cloud.openapi.subscribeMessage.send(templateData)
      console.log('订阅消息发送结果:', safeStringify(result))
      
      if (result.errCode === 0) {
        console.log('=== 消息发送成功 ===')
        const successResult = {
          success: true,
          message: '订阅消息发送成功',
          data: {
            errCode: result.errCode,
            errMsg: result.errMsg
          }
        }
        console.log('返回成功结果:', safeStringify(successResult))
        return successResult
      } else {
        console.log('订阅消息发送失败:', result.errMsg, '错误码:', result.errCode)
        
        // 权限错误直接提示
        if (result.errCode === -604101) {
          console.log('权限错误-604101')
          return {
            success: false,
            message: '权限不足，无法发送订阅消息',
            errCode: result.errCode,
            solution: '请在云开发控制台 → 设置 → 权限设置 → 令牌权限配置中添加：/wxa/openapi'
          }
        }
        
        const failResult = {
          success: false,
          message: `发送失败: ${result.errMsg}`,
          errCode: result.errCode
        }
        console.log('返回失败结果:', safeStringify(failResult))
        return failResult
      }
    } catch (apiError) {
      console.log('API调用异常:', apiError.message)
      
      // 如果是权限错误，直接提示
      if (apiError.message.includes('-604101')) {
        return {
          success: false,
          message: '权限不足，无法发送订阅消息',
          errCode: -604101,
          solution: '请在云开发控制台 → 设置 → 权限设置 → 令牌权限配置中添加：/wxa/openapi'
        }
      }
      
      // 其他错误继续抛出
      throw apiError
    }
    
  } catch (error) {
    console.error('=== 发送消息异常 ===', error)
    
    // 权限错误的特殊处理
    if (error.message && error.message.includes('-604101')) {
      const errorResult = {
        success: false,
        message: '权限不足，无法发送订阅消息',
        errCode: -604101,
        solution: '请在云开发控制台 → 设置 → 权限设置 → 令牌权限配置中添加：/wxa/openapi'
      }
      console.log('权限错误直接提示:', safeStringify(errorResult))
      return errorResult
    }
    
    const errorResult = {
      success: false,
      message: '发送失败，请稍后重试',
      error: error.message
    }
    console.log('返回异常结果:', safeStringify(errorResult))
    return errorResult
  }
}