// pages/detail/detail.js
const app = getApp()
const messageService = require('../../utils/messageService.js')

Page({
  data: {
    dishDetail: {},
    isSelected: false
  },

  onLoad(options) {
    const dishId = options.id
    if (dishId) {
      this.loadDishDetail(dishId)
    }
  },

  onShow() {
    this.checkSelectedStatus()
  },

  // 加载菜品详情
  loadDishDetail(dishId) {
    // 这里应该从服务器获取菜品详情，现在使用模拟数据
    const mockDishDetail = {
      id: parseInt(dishId),
      name: '宫保鸡丁',
      category: '荤菜',
      difficulty: '中等',
      cookingTime: '30分钟',
      servings: 2,
      calories: '320卡',
      image: 'https://via.placeholder.com/400x300/ff6b6b/ffffff?text=宫保鸡丁',
      description: '宫保鸡丁是一道经典的川菜，以鸡肉为主料，配以花生米、黄瓜等，口感鲜嫩，味道香辣。',
      ingredients: [
        { name: '鸡胸肉', amount: '300g' },
        { name: '花生米', amount: '50g' },
        { name: '黄瓜', amount: '1根' },
        { name: '干辣椒', amount: '10个' },
        { name: '花椒', amount: '1小把' },
        { name: '大葱', amount: '2根' },
        { name: '生姜', amount: '1块' },
        { name: '大蒜', amount: '3瓣' },
        { name: '生抽', amount: '2勺' },
        { name: '老抽', amount: '1勺' },
        { name: '料酒', amount: '1勺' },
        { name: '白糖', amount: '1勺' },
        { name: '醋', amount: '1勺' },
        { name: '盐', amount: '适量' },
        { name: '淀粉', amount: '1勺' }
      ],
      steps: [
        {
          description: '鸡胸肉切成1.5cm见方的小丁，用料酒、生抽、盐、淀粉腌制15分钟。',
          image: 'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=步骤1'
        },
        {
          description: '黄瓜切丁，大葱切段，生姜、大蒜切片，干辣椒剪成段。',
          image: 'https://via.placeholder.com/300x200/4ecdc4/ffffff?text=步骤2'
        },
        {
          description: '热锅下油，放入花生米炸至金黄，捞出备用。',
          image: 'https://via.placeholder.com/300x200/45b7d1/ffffff?text=步骤3'
        },
        {
          description: '锅中留底油，下入鸡丁炒至变色，盛出备用。',
          image: 'https://via.placeholder.com/300x200/96ceb4/ffffff?text=步骤4'
        },
        {
          description: '锅中再下油，放入干辣椒、花椒爆香，下入葱姜蒜炒香。',
          image: 'https://via.placeholder.com/300x200/feca57/ffffff?text=步骤5'
        },
        {
          description: '倒入鸡丁和黄瓜丁翻炒，加入生抽、老抽、白糖、醋调味。',
          image: 'https://via.placeholder.com/300x200/ff9ff3/ffffff?text=步骤6'
        },
        {
          description: '最后加入花生米翻炒均匀，即可出锅装盘。',
          image: 'https://via.placeholder.com/300x200/54a0ff/ffffff?text=步骤7'
        }
      ],
      tips: '1. 鸡丁要切得大小均匀，这样炒出来的口感更好。\n2. 花生米要最后加入，保持酥脆口感。\n3. 炒制过程中火候要掌握好，避免炒糊。\n4. 可以根据个人口味调整辣椒和花椒的用量。'
    }

    this.setData({
      dishDetail: mockDishDetail
    })
  },

  // 检查是否已选中
  checkSelectedStatus() {
    const selectedDishes = app.getSelectedDishes()
    const isSelected = selectedDishes.some(dish => dish.id === this.data.dishDetail.id)
    this.setData({
      isSelected: isSelected
    })
  },

  // 添加到菜单
  addToMenu() {
    const dish = this.data.dishDetail
    app.addSelectedDish(dish)
    
    this.setData({
      isSelected: true
    })
    
    wx.showToast({
      title: '已添加到菜单',
      icon: 'success'
    })
  },

  // 从菜单中移除
  removeFromMenu() {
    const dishId = this.data.dishDetail.id
    app.removeSelectedDish(dishId)
    
    this.setData({
      isSelected: false
    })
    
    wx.showToast({
      title: '已从菜单中移除',
      icon: 'success'
    })
  },

  // 分享菜品
  shareDish() {
    const dish = this.data.dishDetail
    
    // 显示分享选项
    wx.showActionSheet({
      itemList: ['发送给宝宝', '复制到剪贴板', '分享给朋友'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.sendWeChatDishMessage(dish)
            break
          case 1:
            this.copyDishToClipboard(dish)
            break
          case 2:
            this.shareDishToFriend(dish)
            break
        }
      }
    })
  },

  // 发送微信菜品消息
  sendWeChatDishMessage(dish) {
    wx.showLoading({
      title: '发送中...'
    })

    messageService.sendDishMessage(dish)
      .then((result) => {
        wx.hideLoading()
        if (result.success) {
          wx.showToast({
            title: '发送成功',
            icon: 'success'
          })
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

  // 复制菜品到剪贴板
  copyDishToClipboard(dish) {
    let shareContent = `推荐一道美味的${dish.name}！\n\n`
    shareContent += `难度：${dish.difficulty}\n`
    shareContent += `制作时间：${dish.cookingTime}\n`
    shareContent += `适合人数：${dish.servings}人\n\n`
    shareContent += `食材清单：\n`
    dish.ingredients.slice(0, 5).forEach(ingredient => {
      shareContent += `• ${ingredient.name} ${ingredient.amount}\n`
    })
    if (dish.ingredients.length > 5) {
      shareContent += `...等${dish.ingredients.length}种食材\n`
    }

    messageService.copyToClipboard(shareContent)
      .catch((error) => {
        wx.showToast({
          title: error.message || '复制失败',
          icon: 'none'
        })
      })
  },

  // 分享菜品给朋友
  shareDishToFriend(dish) {
    let shareContent = `推荐一道美味的${dish.name}！\n\n`
    shareContent += `难度：${dish.difficulty}\n`
    shareContent += `制作时间：${dish.cookingTime}\n`
    shareContent += `适合人数：${dish.servings}人\n\n`
    shareContent += `食材清单：\n`
    dish.ingredients.slice(0, 5).forEach(ingredient => {
      shareContent += `• ${ingredient.name} ${ingredient.amount}\n`
    })
    if (dish.ingredients.length > 5) {
      shareContent += `...等${dish.ingredients.length}种食材\n`
    }

    // 复制到剪贴板
    wx.setClipboardData({
      data: shareContent,
      success: () => {
        wx.showModal({
          title: '菜品已复制',
          content: '菜品信息已复制到剪贴板，您可以分享给朋友或发送给家人',
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

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 分享给朋友
  onShareAppMessage() {
    const dish = this.data.dishDetail
    return {
      title: `推荐一道美味的${dish.name}`,
      desc: `${dish.description}`,
      path: `/pages/detail/detail?id=${dish.id}`
    }
  }
})
