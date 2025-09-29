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

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('=== 云函数开始执行 ===')
  console.log('接收到的参数:', JSON.stringify(event, null, 2))
  
  const wxContext = cloud.getWXContext()
  console.log('微信上下文:', wxContext)
  
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
      touser: wxContext.OPENID, // 发送给当前用户
      template_id: templateId,
      page: 'pages/index/index', // 点击消息跳转的页面
      data: {
        thing1: {
          value: '已生成待确认菜谱' // 菜谱类型
        },
        time2: {
          value: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) // 菜谱日期
        },
        thing4: {
          value: message.length > 20 ? message.substring(0, 20) + '...' : message // 备注
        }
      },
      miniprogram_state: 'formal' // 正式版
    }
    
    console.log('模板消息数据:', templateData)
    
    // 发送订阅消息
    console.log('开始发送订阅消息')
    
    try {
      const result = await cloud.openapi.subscribeMessage.send(templateData)
      console.log('订阅消息发送结果:', result)
      
      if (result.errCode === 0) {
        console.log('=== 消息发送成功 ===')
        const successResult = {
          success: true,
          message: '订阅消息发送成功',
          data: result
        }
        console.log('返回成功结果:', successResult)
        return successResult
      } else {
        console.log('订阅消息发送失败:', result.errMsg, '错误码:', result.errCode)
        
        // 权限错误降级处理
        if (result.errCode === -604101) {
          console.log('权限错误-604101，降级到复制功能')
          const cleanMessage = message.replace(/时间：.*?\n/g, '').replace(/来自：.*$/, '')
          
          return {
            success: true,
            message: '消息已准备，请手动转发给工口园',
            needManualForward: true,
            templateMessage: cleanMessage,
            debugInfo: {
              error: '权限错误-604101',
              solution: '需要在微信公众平台绑定开发者身份',
              steps: [
                '1. 访问 https://mp.weixin.qq.com/',
                '2. 成员管理 → 添加开发者',
                '3. 绑定当前微信号',
                '4. 重新登录开发者工具'
              ]
            }
          }
        }
        
        const failResult = {
          success: false,
          message: `发送失败: ${result.errMsg}`,
          errCode: result.errCode
        }
        console.log('返回失败结果:', failResult)
        return failResult
      }
    } catch (apiError) {
      console.log('API调用异常:', apiError.message)
      
      // 如果是权限错误，返回降级方案
      if (apiError.message.includes('-604101')) {
        const cleanMessage = message.replace(/时间：.*?\n/g, '').replace(/来自：.*$/, '')
        
        return {
          success: true,
          message: '消息已准备（开发者权限待解决）',
          needManualForward: true,
          templateMessage: cleanMessage,
          debugInfo: {
            error: '权限错误-604101',
            solution: '需要在微信公众平台绑定开发者身份',
            urgency: 'high'
          }
        }
      }
      
      // 其他错误继续抛出
      throw apiError
    }
    
  } catch (error) {
    console.error('=== 发送消息异常 ===', error)
    
    // 权限错误的特殊处理
    if (error.message && error.message.includes('-604101')) {
      const cleanMessage = event.message ? event.message.replace(/时间：.*?\n/g, '').replace(/来自：.*$/, '') : ''
      
      const errorResult = {
        success: true,
        message: '消息已准备（权限问题），请手动转发',
        needManualForward: true,
        templateMessage: cleanMessage,
        debugInfo: {
          error: '权限错误-604101',
          solution: '绑定开发者身份',
          actionRequired: 'manual_forward'
        }
      }
      console.log('权限错误降级结果:', errorResult)
      return errorResult
    }
    
    const errorResult = {
      success: false,
      message: '发送失败，请稍后重试',
      error: error.message
    }
    console.log('返回异常结果:', errorResult)
    return errorResult
  }
}