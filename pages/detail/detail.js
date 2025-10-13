// pages/detail/detail.js
const app = getApp()
const messageService = require('../../utils/messageService.js')
const cloudApiService = require('../../utils/cloudApi.js')

Page({
  data: {
    dishDetail: {},
    isSelected: false,
    loading: false,
    error: null
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
  async loadDishDetail(dishId) {
    this.setData({ loading: true, error: null })
    
    try {
      // 从云开发获取菜品详情
      const response = await cloudApiService.getRecipeById(dishId)
      
      if (response.success && response.data) {
        const recipe = response.data
        
        // 转换数据格式以适配小程序
        const dishDetail = {
          id: recipe._id,
          name: recipe.title,
          description: recipe.description,
          image: recipe.image || '/images/default-dish.png',
          category: recipe.category,
          difficulty: recipe.difficulty,
          cookingTime: recipe.cookingTime,
          servings: recipe.servings,
          calories: recipe.calories,
          rating: recipe.rating,
          likeCount: recipe.likeCount,
          viewCount: recipe.viewCount,
          ingredients: recipe.ingredients || [],
          steps: recipe.steps || [],
          tips: recipe.tips,
          author: recipe.author,
          sourceUrl: recipe.sourceUrl,
          tags: recipe.tags || []
        }
        
        this.setData({
          dishDetail: dishDetail,
          loading: false
        })
        
        // 检查选中状态
        this.checkSelectedStatus()
      } else {
        throw new Error(response.message || '菜品不存在')
      }
    } catch (error) {
      console.error('加载菜品详情失败:', error)
      
      // 如果云开发失败，使用本地数据作为备用
      const { getDishDetail } = require('../../data/dishes.js')
      const fallbackDetail = getDishDetail(parseInt(dishId))
      
      if (fallbackDetail) {
        this.setData({
          dishDetail: fallbackDetail,
          loading: false,
          error: '网络连接失败，已加载本地数据'
        })
        
        wx.showToast({
          title: '网络连接失败，已加载本地数据',
          icon: 'none',
          duration: 2000
        })
      } else {
        this.setData({
          loading: false,
          error: '菜品不存在'
        })
        
        wx.showToast({
          title: '菜品不存在',
          icon: 'none'
        })
        
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    }
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
