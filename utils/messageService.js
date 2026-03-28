const auth = require('./authorization.js')
const messageConfig = require('../config/messageConfig.js')

const CONFIG = {
  TARGET_USER_ID: messageConfig.TARGET_USER.WECHAT_ID,
  TARGET_NICKNAME: messageConfig.TARGET_USER.NICKNAME,
  TEMPLATE_IDS: {
    menu: messageConfig.TEMPLATE_MESSAGE.MENU_TEMPLATE_ID,
    rating: messageConfig.TEMPLATE_MESSAGE.RATING_TEMPLATE_ID,
    dish: messageConfig.TEMPLATE_MESSAGE.DISH_TEMPLATE_ID
  },
  MESSAGE_TEMPLATE: messageConfig.MESSAGE_TEMPLATES
}

function sendMenuMessage(dishes, date) {
  const menuContent = dishes.map((dish, index) => `${index + 1}. ${dish.name}`).join('\n')
  const message = CONFIG.MESSAGE_TEMPLATE.MENU
    .replace('{menu}', menuContent)
    .replace('{date}', date)

  return sendWeChatMessage(message, CONFIG.TEMPLATE_IDS.menu)
}

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

  const message = CONFIG.MESSAGE_TEMPLATE.RATING
    .replace('{rating}', ratingContent)
    .replace('{time}', time)

  return sendWeChatMessage(message, CONFIG.TEMPLATE_IDS.rating)
}

function sendDishMessage(dish) {
  const ingredients = dish.ingredients.slice(0, 5).map((ingredient) => `- ${ingredient.name} ${ingredient.amount}`).join('\n')
  const message = CONFIG.MESSAGE_TEMPLATE.DISH
    .replace('{name}', dish.name)
    .replace('{difficulty}', dish.difficulty)
    .replace('{time}', dish.cookingTime)
    .replace('{servings}', dish.servings)
    .replace('{ingredients}', ingredients)

  return sendWeChatMessage(message, CONFIG.TEMPLATE_IDS.dish || CONFIG.TEMPLATE_IDS.menu)
}

function sendWeChatMessage(message, templateId) {
  return new Promise((resolve, reject) => {
    sendTemplateMessage(message, templateId, resolve, reject)
  })
}

function sendTemplateMessage(message, templateId, resolve, reject) {
  auth.requestSubscribeMessage(templateId)
    .then(() => sendTemplateMessageToServer(message, templateId).then(resolve).catch(() => fallbackToClipboard(message, resolve, reject)))
    .catch(() => fallbackToClipboard(message, resolve, reject))
}

function sendTemplateMessageToServer(message, templateId) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'sendMessage',
      data: {
        message,
        targetUserId: CONFIG.TARGET_USER_ID,
        templateId
      },
      success: (res) => {
        if (res.result && res.result.success) {
          resolve({
            success: true,
            method: 'template_message',
            message: '消息已处理完成'
          })
          return
        }

        reject(new Error(res.result ? res.result.message : '模板消息发送失败'))
      },
      fail: () => {
        reject(new Error('云函数调用失败'))
      }
    })
  })
}

function fallbackToClipboard(message, resolve, reject) {
  wx.setClipboardData({
    data: message,
    success: () => {
      wx.showModal({
        title: '消息已复制',
        content: `消息已复制到剪贴板，请手动转发给${CONFIG.TARGET_NICKNAME}`,
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
    fail: () => {
      reject({
        success: false,
        message: '复制失败，请重试'
      })
    }
  })
}

function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
        resolve({ success: true, message: '已复制到剪贴板' })
      },
      fail: reject
    })
  })
}

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
