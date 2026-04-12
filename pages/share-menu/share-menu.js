Page({
  data: {
    shareData: {
      type: 'menu',
      title: '分享菜单',
      subtitle: '',
      items: []
    },
    error: ''
  },

  onLoad(options) {
    try {
      const payload = String(options.payload || '')
      const decoded = payload ? JSON.parse(decodeURIComponent(payload)) : null
      if (!decoded || !Array.isArray(decoded.items)) {
        throw new Error('分享内容不存在')
      }

      this.setData({
        shareData: {
          type: decoded.type || 'menu',
          title: decoded.title || '分享菜单',
          subtitle: decoded.subtitle || '',
          items: decoded.items.slice(0, 8)
        }
      })
    } catch (error) {
      this.setData({
        error: '分享内容暂时无法解析',
        shareData: {
          type: 'menu',
          title: '分享菜单',
          subtitle: '',
          items: []
        }
      })
    }
  },

  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  onShareAppMessage() {
    const title = this.data.shareData.title || '分享菜单'
    return {
      title,
      path: '/pages/index/index'
    }
  }
})
