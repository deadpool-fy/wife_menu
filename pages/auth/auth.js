// pages/auth/auth.js
const auth = require('../../utils/authorization.js')

Page({
  data: {
    subscribeMessageAuth: false,
    userInfoAuth: false,
    locationAuth: false
  },

  onLoad() {
    this.checkAuthStatus()
  },

  onShow() {
    this.checkAuthStatus()
  },

  // 检查授权状态
  checkAuthStatus() {
    auth.checkAuthStatus()
      .then((authStatus) => {
        this.setData({
          subscribeMessageAuth: authStatus.subscribeMessage,
          userInfoAuth: authStatus.userInfo,
          locationAuth: authStatus.location
        })
      })
      .catch((error) => {
        console.error('检查授权状态失败:', error)
      })
  },

  // 一键授权
  requestAllAuth() {
    wx.showModal({
      title: '一键授权',
      content: '将为您请求所有必要的权限，您可以在设置中随时修改。',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      success: (res) => {
        if (res.confirm) {
          this.requestSubscribeMessage()
        }
      }
    })
  },

  // 请求订阅消息授权
  requestSubscribeMessage() {
    wx.showLoading({
      title: '请求授权中...'
    })

    auth.requestSubscribeMessage('tLEKQiiMe8JDjm1GIGq5UDbHrZNZX0bxOhuRM0zho4g')
      .then(() => {
        wx.hideLoading()
        wx.showToast({
          title: '授权成功',
          icon: 'success'
        })
        this.checkAuthStatus()
      })
      .catch((error) => {
        wx.hideLoading()
        if (error.message === '用户拒绝接收消息') {
          wx.showModal({
            title: '授权被拒绝',
            content: '您拒绝了消息通知授权，将无法接收菜单和评价消息。您可以在设置中重新开启。',
            showCancel: false,
            confirmText: '知道了'
          })
        } else {
          wx.showToast({
            title: '授权失败',
            icon: 'none'
          })
        }
        this.checkAuthStatus()
      })
  },

  // 打开设置页面
  openSetting() {
    auth.openSetting()
      .then((res) => {
        if (res.success) {
          this.checkAuthStatus()
          wx.showToast({
            title: '设置已更新',
            icon: 'success'
          })
        }
      })
      .catch((error) => {
        console.error('打开设置失败:', error)
      })
  },

  // 显示授权说明
  showAuthGuide() {
    auth.showAuthGuide()
  }
})
