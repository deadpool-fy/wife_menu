// cloudfunctions/testPermission/index.js
// 测试权限的简化云函数

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  console.log('=== 权限测试开始 ===')
  
  try {
    // 测试最简单的API调用
    const result = await cloud.openapi.subscribeMessage.send({
      touser: 'test_openid',
      template_id: 'tLEKQiiMe8JDjm1GIGq5UDbHrZNZX0bxOhuRM0zho4g',
      page: 'pages/index/index',
      data: {
        thing1: { value: '测试' },
        time2: { value: '2025-09-29' },
        thing4: { value: '测试消息' }
      }
    })
    
    console.log('权限测试成功:', result)
    return {
      success: true,
      message: '权限测试通过',
      result: result
    }
  } catch (error) {
    console.log('权限测试失败:', error)
    return {
      success: false,
      message: '权限测试失败',
      error: error.message,
      errCode: error.errCode,
      fullError: error
    }
  }
}
