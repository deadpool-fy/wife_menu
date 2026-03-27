const app = getApp()
const messageService = require('../../utils/messageService.js')

Page({
  data: {
    selectedDishes: [],
    canSubmit: false,
    completedRatings: 0,
    totalDishes: 0,
    ratingProgress: 0
  },

  onLoad() {
    this.loadSelectedDishes()
  },

  loadSelectedDishes() {
    const dishesWithRating = app.getSelectedDishes().map((dish) => ({
      ...dish,
      rating: 0,
      comment: ''
    }))

    this.setData({
      selectedDishes: dishesWithRating
    })

    this.syncProgress()
  },

  setRating(e) {
    const { dishId, rating } = e.currentTarget.dataset

    this.setData({
      selectedDishes: this.data.selectedDishes.map((dish) => (
        dish.id === dishId ? { ...dish, rating } : dish
      ))
    })

    this.syncProgress()
  },

  onCommentInput(e) {
    const { dishId } = e.currentTarget.dataset
    const comment = e.detail.value

    this.setData({
      selectedDishes: this.data.selectedDishes.map((dish) => (
        dish.id === dishId ? { ...dish, comment } : dish
      ))
    })

    this.syncProgress()
  },

  syncProgress() {
    const selectedDishes = this.data.selectedDishes
    const completedRatings = selectedDishes.filter((dish) => dish.rating > 0 || dish.comment.trim().length > 0).length
    const totalDishes = selectedDishes.length

    this.setData({
      completedRatings,
      totalDishes,
      ratingProgress: totalDishes ? Math.round((completedRatings / totalDishes) * 100) : 0,
      canSubmit: completedRatings > 0
    })
  },

  submitRating() {
    const ratings = this.data.selectedDishes.filter((dish) => dish.rating > 0 || dish.comment.trim().length > 0)

    if (!ratings.length) {
      wx.showToast({
        title: '请至少评价一道菜',
        icon: 'none'
      })
      return
    }

    wx.showActionSheet({
      itemList: ['发送给家人', '复制到剪贴板', '分享给朋友'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.sendWeChatRatingMessage(ratings)
        } else if (res.tapIndex === 1) {
          this.copyRatingToClipboard(ratings)
        } else if (res.tapIndex === 2) {
          this.shareRatingToFriend(ratings)
        }
      }
    })
  },

  sendWeChatRatingMessage(ratings) {
    wx.showLoading({ title: '发送中...' })

    const currentTime = messageService.getCurrentTime()

    messageService.sendRatingMessage(ratings, currentTime)
      .then((result) => {
        wx.hideLoading()

        if (!result.success) {
          wx.showToast({
            title: result.message || '发送失败',
            icon: 'none'
          })
          return
        }

        wx.showToast({
          title: '评价发送成功',
          icon: 'success'
        })

        app.clearSelectedDishes()

        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1200)
      })
      .catch((error) => {
        wx.hideLoading()
        wx.showToast({
          title: error.message || '发送失败',
          icon: 'none'
        })
      })
  },

  copyRatingToClipboard(ratings) {
    let content = '今天的菜单评价：\n\n'

    ratings.forEach((dish, index) => {
      content += `${index + 1}. ${dish.name}\n`
      if (dish.rating > 0) {
        content += `评分：${dish.rating} 分\n`
      }
      if (dish.comment.trim()) {
        content += `评价：${dish.comment}\n`
      }
      content += '\n'
    })

    content += `评价时间：${this.getCurrentTime()}`

    messageService.copyToClipboard(content)
      .then(() => {
        app.clearSelectedDishes()
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1200)
      })
      .catch((error) => {
        wx.showToast({
          title: error.message || '复制失败',
          icon: 'none'
        })
      })
  },

  shareRatingToFriend(ratings) {
    let content = '今天的菜单评价：\n\n'

    ratings.forEach((dish, index) => {
      content += `${index + 1}. ${dish.name}\n`
      if (dish.rating > 0) {
        content += `评分：${dish.rating} 分\n`
      }
      if (dish.comment.trim()) {
        content += `评价：${dish.comment}\n`
      }
      content += '\n'
    })

    content += `评价时间：${this.getCurrentTime()}`

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showModal({
          title: '评价已复制',
          content: '可以把这份菜单反馈直接发送给家人或朋友。',
          showCancel: false
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  },

  skipRating() {
    wx.showModal({
      title: '跳过评价',
      content: '确定现在先不评价，直接返回首页吗？',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        app.clearSelectedDishes()
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    })
  },

  getCurrentTime() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const hour = now.getHours()
    const minute = now.getMinutes().toString().padStart(2, '0')

    return `${year}年${month}月${day}日 ${hour}:${minute}`
  }
})
