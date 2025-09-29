// pages/rating/rating.js
const app = getApp()
const messageService = require('../../utils/messageService.js')

Page({
  data: {
    selectedDishes: [],
    canSubmit: false
  },

  onLoad() {
    this.loadSelectedDishes()
  },

  // 加载已选择的菜品
  loadSelectedDishes() {
    const selectedDishes = app.getSelectedDishes()
    
    // 为每个菜品添加评分和评价字段
    const dishesWithRating = selectedDishes.map(dish => ({
      ...dish,
      rating: 0,
      comment: ''
    }))
    
    this.setData({
      selectedDishes: dishesWithRating
    })
    
    this.checkCanSubmit()
  },

  // 设置评分
  setRating(e) {
    const dishId = e.currentTarget.dataset.dishId
    const rating = e.currentTarget.dataset.rating
    
    const selectedDishes = this.data.selectedDishes.map(dish => {
      if (dish.id === dishId) {
        return { ...dish, rating: rating }
      }
      return dish
    })
    
    this.setData({
      selectedDishes: selectedDishes
    })
    
    this.checkCanSubmit()
  },

  // 输入评价内容
  onCommentInput(e) {
    const dishId = e.currentTarget.dataset.dishId
    const comment = e.detail.value
    
    const selectedDishes = this.data.selectedDishes.map(dish => {
      if (dish.id === dishId) {
        return { ...dish, comment: comment }
      }
      return dish
    })
    
    this.setData({
      selectedDishes: selectedDishes
    })
    
    this.checkCanSubmit()
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const selectedDishes = this.data.selectedDishes
    const hasRating = selectedDishes.some(dish => dish.rating > 0)
    const hasComment = selectedDishes.some(dish => dish.comment.trim().length > 0)
    
    this.setData({
      canSubmit: hasRating || hasComment
    })
  },

  // 提交评价
  submitRating() {
    const selectedDishes = this.data.selectedDishes
    const ratings = selectedDishes.filter(dish => dish.rating > 0 || dish.comment.trim().length > 0)
    
    if (ratings.length === 0) {
      wx.showToast({
        title: '请至少评价一道菜',
        icon: 'none'
      })
      return
    }

    // 显示发送选项
    wx.showActionSheet({
      itemList: ['发送给宝宝', '复制到剪贴板', '分享给朋友'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.sendWeChatRatingMessage(ratings)
            break
          case 1:
            this.copyRatingToClipboard(ratings)
            break
          case 2:
            this.shareRatingToFriend(ratings)
            break
        }
      }
    })
  },

  // 发送微信评价消息
  sendWeChatRatingMessage(ratings) {
    wx.showLoading({
      title: '发送中...'
    })

    const currentTime = messageService.getCurrentTime()
    messageService.sendRatingMessage(ratings, currentTime)
      .then((result) => {
        wx.hideLoading()
        if (result.success) {
          wx.showToast({
            title: '评价发送成功',
            icon: 'success'
          })
          // 清空已选择的菜品
          app.clearSelectedDishes()
          // 跳转回首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            })
          }, 1500)
        } else {
          wx.showToast({
            title: result.message || '发送失败',
            icon: 'none'
          })
        }
      })
      .catch((error) => {
        wx.hideLoading()
        wx.showToast({
          title: error.message || '发送失败',
          icon: 'none'
        })
      })
  },

  // 复制评价到剪贴板
  copyRatingToClipboard(ratings) {
    let ratingContent = `今天的菜品评价：\n\n`
    ratings.forEach((dish, index) => {
      ratingContent += `${index + 1}. ${dish.name}\n`
      if (dish.rating > 0) {
        ratingContent += `评分：${dish.rating}分\n`
      }
      if (dish.comment.trim()) {
        ratingContent += `评价：${dish.comment}\n`
      }
      ratingContent += `\n`
    })
    
    ratingContent += `评价时间：${this.getCurrentTime()}`

    messageService.copyToClipboard(ratingContent)
      .then(() => {
        // 清空已选择的菜品
        app.clearSelectedDishes()
        // 跳转回首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      })
      .catch((error) => {
        wx.showToast({
          title: error.message || '复制失败',
          icon: 'none'
        })
      })
  },

  // 分享评价给朋友
  shareRatingToFriend(ratings) {
    let ratingContent = `今天的菜品评价：\n\n`
    ratings.forEach((dish, index) => {
      ratingContent += `${index + 1}. ${dish.name}\n`
      if (dish.rating > 0) {
        ratingContent += `评分：${dish.rating}分\n`
      }
      if (dish.comment.trim()) {
        ratingContent += `评价：${dish.comment}\n`
      }
      ratingContent += `\n`
    })
    
    ratingContent += `评价时间：${this.getCurrentTime()}`

    // 复制到剪贴板
    wx.setClipboardData({
      data: ratingContent,
      success: () => {
        wx.showModal({
          title: '评价已复制',
          content: '评价已复制到剪贴板，您可以分享给朋友或发送给家人',
          showCancel: false,
          confirmText: '知道了'
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

  // 跳过评价
  skipRating() {
    wx.showModal({
      title: '确认跳过',
      content: '确定要跳过评价吗？',
      success: (res) => {
        if (res.confirm) {
          // 清空已选择的菜品
          app.clearSelectedDishes()
          
          // 跳转回首页
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      }
    })
  },

  // 获取当前时间
  getCurrentTime() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const hour = now.getHours()
    const minute = now.getMinutes()
    
    return `${year}年${month}月${day}日 ${hour}:${minute.toString().padStart(2, '0')}`
  }
})
