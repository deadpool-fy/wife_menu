// utils/messageService.js
// 消息发送服务

const auth = require('./authorization.js')

// 配置信息
const CONFIG = {
  // 固定的接收者微信ID
  TARGET_USER_ID: 'Dingding7654321_',
  // 接收者昵称
  TARGET_NICKNAME: '宝宝',
  // 微信消息模板
  WECHAT_MESSAGE_TEMPLATE: {
    menu: '今天中午的菜单：\n\n{menu}\n\n时间：{date}\n\n来自：家庭菜单小程序',
    rating: '今天的菜品评价：\n\n{rating}\n\n评价时间：{time}\n\n来自：家庭菜单小程序',
    dish: '推荐一道美味的{name}！\n\n难度：{difficulty}\n制作时间：{time}\n适合人数：{servings}人\n\n食材清单：\n{ingredients}\n\n来自：家庭菜单小程序'
  }
}

// 发送菜单消息
function sendMenuMessage(dishes, date) {
  const menuContent = dishes.map((dish, index) => `${index + 1}. ${dish.name}`).join('\n')
  const message = CONFIG.WECHAT_MESSAGE_TEMPLATE.menu
    .replace('{menu}', menuContent)
    .replace('{date}', date)
  
  return sendWeChatMessage(message)
}

// 发送评价消息
function sendRatingMessage(ratings, time) {
  const ratingContent = ratings.map((dish, index) => {
    let content = `${index + 1}. ${dish.name}\n`
    if (dish.rating > 0) {
      content += `评分：${dish.rating}分\n`
    }
    if (dish.comment && dish.comment.trim()) {
      content += `评价：${dish.comment}\n`
    }
    return content
  }).join('\n')
  
  const message = CONFIG.WECHAT_MESSAGE_TEMPLATE.rating
    .replace('{rating}', ratingContent)
    .replace('{time}', time)
  
  return sendWeChatMessage(message)
}

// 发送菜品推荐消息
function sendDishMessage(dish) {
  const ingredients = dish.ingredients.slice(0, 5).map(ingredient => 
    `• ${ingredient.name} ${ingredient.amount}`
  ).join('\n')
  
  const message = CONFIG.WECHAT_MESSAGE_TEMPLATE.dish
    .replace('{name}', dish.name)
    .replace('{difficulty}', dish.difficulty)
    .replace('{time}', dish.cookingTime)
    .replace('{servings}', dish.servings)
    .replace('{ingredients}', ingredients)
  
  return sendWeChatMessage(message)
}

// 发送微信消息
function sendWeChatMessage(message) {
  return new Promise((resolve, reject) => {
    // 直接使用模板消息（订阅消息）
    sendTemplateMessage(message, resolve, reject)
  })
}

// 发送模板消息
function sendTemplateMessage(message, resolve, reject) {
  // 使用授权工具请求订阅消息
  auth.requestSubscribeMessage('tLEKQiiMe8JDjm1GIGq5UDbHrZNZX0bxOhuRM0zho4g') // 替换为实际的模板ID
    .then(() => {
      // 用户同意，发送模板消息
      sendTemplateMessageToServer(message)
        .then(resolve)
        .catch((error) => {
          console.log('发送模板消息失败:', error)
          // 发送失败，降级到复制功能
          fallbackToClipboard(message, resolve, reject)
        })
    })
    .catch((error) => {
      console.log('用户拒绝授权或授权失败:', error)
      // 降级到复制功能
      fallbackToClipboard(message, resolve, reject)
    })
}

// 发送模板消息到服务器
function sendTemplateMessageToServer(message) {
  return new Promise((resolve, reject) => {
    // 调用云函数发送订阅消息
    wx.cloud.callFunction({
      name: 'sendMessage',
      data: {
        message: message,
        targetUserId: CONFIG.TARGET_USER_ID,
        templateId: 'tLEKQiiMe8JDjm1GIGq5UDbHrZNZX0bxOhuRM0zho4g' // 替换为实际模板ID
      },
      success: (res) => {
        console.log('云函数调用成功，返回结果:', res)
        if (res.result && res.result.success) {
          console.log('云函数返回成功，检查是否有clipboard数据:', res.result.clipboard)
          
          if (res.result.clipboard && res.result.clipboard.ready) {
            // 有剪贴板数据，自动复制
            wx.setClipboardData({
              data: res.result.clipboard.message || res.result.clipboard.content,
              success: () => {
                resolve({
                  success: true,
                  method: 'clipboard_copy',
                  message: '消息已复制到剪贴板，请手动转发给工口园'
                })
              },
              fail: () => {
                resolve({
                  success: true,
                  method: 'template_message_prepared',
                  message: '消息已准备，请手动复制转发（权限问题待解决）'
                })
              }
            })
          } else {
            resolve({
              success: true,
              method: 'template_message',
              message: '消息已发送到您的微信'
            })
          }
        } else {
          console.log('云函数返回失败:', res.result)
          reject({
            success: false,
            message: res.result ? res.result.message : '模板消息发送失败',
            errCode: res.result ? res.result.errCode : null,
            solution: res.result ? res.result.solution : null
          })
        }
      },
      fail: (error) => {
        console.error('云函数调用失败:', error)
        reject({
          success: false,
          message: '网络请求失败，请检查云函数配置'
        })
      }
    })
  })
}

// 降级方案：复制到剪贴板
function fallbackToClipboard(message, resolve, reject) {
  wx.setClipboardData({
    data: message,
    success: () => {
      wx.showModal({
        title: '消息已复制',
        content: `消息已复制到剪贴板，请打开微信粘贴发送给${CONFIG.TARGET_NICKNAME}`,
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          resolve({
            success: true,
            method: 'clipboard',
            message: '消息已复制到剪贴板'
          })
        }
      })
    },
    fail: (err) => {
      console.error('复制失败', err)
      reject({
        success: false,
        message: '复制失败，请重试'
      })
    }
  })
}

// 降级方案：使用分享功能
function fallbackToShare(message, resolve, reject) {
  wx.showModal({
    title: '发送消息',
    content: message,
    showCancel: true,
    cancelText: '取消',
    confirmText: '分享',
    success: (res) => {
      if (res.confirm) {
        // 触发分享
        wx.showShareMenu({
          withShareTicket: true,
          menus: ['shareAppMessage', 'shareTimeline']
        })
        
        resolve({
          success: true,
          method: 'share',
          message: '请通过分享功能发送消息'
        })
      } else {
        reject({
          success: false,
          message: '用户取消发送'
        })
      }
    }
  })
}


// 复制到剪贴板
function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
        resolve({
          success: true,
          message: '已复制到剪贴板'
        })
      },
      fail: reject
    })
  })
}

// 获取当前时间
function getCurrentTime() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const hour = now.getHours()
  const minute = now.getMinutes()
  
  return `${year}年${month}月${day}日 ${hour}:${minute.toString().padStart(2, '0')}`
}

module.exports = {
  sendMenuMessage,
  sendRatingMessage,
  sendDishMessage,
  copyToClipboard,
  getCurrentTime,
  CONFIG
}
