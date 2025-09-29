// utils/authorization.js
// 用户授权管理

// 请求订阅消息授权
function requestSubscribeMessage(templateId) {
  return new Promise((resolve, reject) => {
    // 先显示授权说明
    wx.showModal({
      title: '消息通知授权',
      content: '为了能够及时通知您关于菜单和评价的消息，需要您的授权。',
      showCancel: true,
      cancelText: '暂不授权',
      confirmText: '去授权',
      success: (res) => {
        if (res.confirm) {
          // 用户同意，直接请求订阅消息
          wx.requestSubscribeMessage({
            tmplIds: [templateId], // 模板ID，如：'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
            success: (res) => {
              if (res[templateId] === 'accept') {
                resolve({
                  success: true,
                  message: '用户同意接收消息'
                })
              } else {
                reject({
                  success: false,
                  message: '用户拒绝接收消息'
                })
              }
            },
            fail: (error) => {
              reject({
                success: false,
                message: '请求订阅消息失败',
                error: error
              })
            }
          })
        } else {
          reject({
            success: false,
            message: '用户取消授权'
          })
        }
      }
    })
  })
}

// 检查用户授权状态
function checkAuthStatus() {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success: (res) => {
        const authStatus = {
          subscribeMessage: true, // 订阅消息不需要预先授权，直接请求即可
          userInfo: res.authSetting['scope.userInfo'] || false,
          location: res.authSetting['scope.userLocation'] || false
        }
        resolve(authStatus)
      },
      fail: reject
    })
  })
}

// 引导用户授权
function guideUserAuth(authType) {
  return new Promise((resolve, reject) => {
    let title = ''
    let content = ''
    let scope = ''
    
    switch (authType) {
      case 'subscribeMessage':
        title = '消息通知授权'
        content = '为了能够及时通知您关于菜单和评价的消息，需要您的授权。'
        scope = 'scope.subscribeMessage'
        break
      case 'userInfo':
        title = '用户信息授权'
        content = '为了提供更好的个性化服务，需要获取您的基本信息。'
        scope = 'scope.userInfo'
        break
      case 'location':
        title = '位置信息授权'
        content = '为了推荐附近的餐厅和食材，需要获取您的位置信息。'
        scope = 'scope.userLocation'
        break
      default:
        reject({
          success: false,
          message: '未知的授权类型'
        })
        return
    }
    
    wx.showModal({
      title: title,
      content: content,
      showCancel: true,
      cancelText: '暂不授权',
      confirmText: '去授权',
      success: (res) => {
        if (res.confirm) {
          // 用户同意，请求授权
          wx.authorize({
            scope: scope,
            success: () => {
              resolve({
                success: true,
                message: '授权成功'
              })
            },
            fail: (error) => {
              reject({
                success: false,
                message: '授权失败',
                error: error
              })
            }
          })
        } else {
          reject({
            success: false,
            message: '用户取消授权'
          })
        }
      }
    })
  })
}

// 打开设置页面
function openSetting() {
  return new Promise((resolve, reject) => {
    wx.openSetting({
      success: (res) => {
        resolve({
          success: true,
          authSetting: res.authSetting
        })
      },
      fail: reject
    })
  })
}

// 显示授权说明
function showAuthGuide() {
  wx.showModal({
    title: '授权说明',
    content: '为了提供更好的服务，小程序需要以下权限：\n\n1. 消息通知：发送菜单和评价消息\n2. 用户信息：个性化推荐\n3. 位置信息：推荐附近餐厅',
    showCancel: false,
    confirmText: '知道了'
  })
}

module.exports = {
  requestSubscribeMessage,
  checkAuthStatus,
  guideUserAuth,
  openSetting,
  showAuthGuide
}
