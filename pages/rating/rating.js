const app = getApp()
const messageService = require('../../utils/messageService.js')
const { decorateRecipeImage } = require('../../utils/recipeImage.js')

function buildSharedRatingPath(ratings = []) {
  const payload = {
    type: 'rating',
    title: '今晚菜单反馈',
    subtitle: '这次吃完后的真实感受',
    items: ratings.slice(0, 8).map((dish) => ({
      name: dish.name,
      category: dish.category,
      cookingTime: dish.cookingTime,
      servings: dish.servings,
      comment: dish.comment || '',
      calories: dish.calories
    }))
  }

  return '/pages/share-menu/share-menu?payload=' + encodeURIComponent(JSON.stringify(payload))
}

Page({
  data: {
    selectedDishes: [],
    canSubmit: false,
    completedRatings: 0,
    totalDishes: 0,
    ratingProgress: 0,
    sharePanelVisible: false,
    shareTitle: '',
    shareSummary: '',
    sharePath: '/pages/index/index'
  },

  onLoad() {
    this.loadSelectedDishes()
  },

  onShow() {
    this.loadSelectedDishes()
  },

  loadSelectedDishes() {
    const storedRatings = wx.getStorageSync('menuRatings') || {}
    const dishesWithRating = app.getSelectedDishes().map((dish) => {
      const cached = storedRatings[dish.id] || {}
      return decorateRecipeImage({
        ...dish,
        rating: Number(cached.rating || dish.rating || 0),
        comment: String(cached.comment || dish.comment || '')
      })
    })

    this.setData({ selectedDishes: dishesWithRating })
    this.syncProgress()
  },

  persistRatings() {
    const payload = {}
    this.data.selectedDishes.forEach((dish) => {
      payload[dish.id] = {
        rating: dish.rating || 0,
        comment: dish.comment || ''
      }
    })
    wx.setStorageSync('menuRatings', payload)
  },

  setRating(e) {
    const { dishId, rating } = e.currentTarget.dataset

    this.setData({
      selectedDishes: this.data.selectedDishes.map((dish) => (
        dish.id === dishId ? { ...dish, rating: Number(rating) } : dish
      ))
    })

    this.persistRatings()
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

    this.persistRatings()
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

        wx.removeStorageSync('menuRatings')
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

  buildRatingText(ratings) {
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
    return content
  },

  copyRatingToClipboard(ratings) {
    const content = this.buildRatingText(ratings)

    messageService.copyToClipboard(content)
      .then(() => {
        wx.removeStorageSync('menuRatings')
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
    this.setData({
      sharePanelVisible: true,
      shareTitle: '今晚菜单反馈已整理好',
      shareSummary: this.buildShareSummary(ratings),
      sharePath: buildSharedRatingPath(ratings)
    })
  },

  buildShareSummary(ratings) {
    return ratings.map((dish) => {
      const pieces = [dish.name]
      if (dish.rating > 0) {
        pieces.push(dish.rating + ' 分')
      }
      if (dish.comment.trim()) {
        pieces.push(dish.comment.trim())
      }
      return pieces.join(' · ')
    }).join('\n')
  },

  closeSharePanel() {
    this.setData({ sharePanelVisible: false })
  },

  skipRating() {
    wx.showModal({
      title: '跳过评价',
      content: '确定现在先不评价，直接返回首页吗？',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        wx.removeStorageSync('menuRatings')
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
  },

  onShareAppMessage() {
    return {
      title: this.data.shareTitle || '今晚菜单反馈已整理好',
      path: this.data.sharePath || '/pages/rating/rating'
    }
  }
})
