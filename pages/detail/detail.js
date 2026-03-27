const app = getApp()
const messageService = require('../../utils/messageService.js')
const cloudApiService = require('../../utils/cloudApi.js')

Page({
  data: {
    dishDetail: {
      ingredients: [],
      steps: []
    },
    isSelected: false,
    loading: false,
    error: null
  },

  onLoad(options) {
    if (options.id) {
      this.loadDishDetail(options.id)
    }
  },

  onShow() {
    this.checkSelectedStatus()
  },

  async loadDishDetail(dishId) {
    this.setData({ loading: true, error: null })

    try {
      const response = await cloudApiService.getRecipeById(dishId)

      if (!(response.success && response.data)) {
        throw new Error(response.message || '菜品不存在')
      }

      const recipe = response.data
      const dishDetail = {
        id: recipe._id,
        name: recipe.title,
        description: recipe.description || '这道菜目前还没有补充介绍，但从配料和步骤来看已经很适合今晚安排。',
        image: recipe.image || '/images/default-dish.png',
        category: recipe.category || '家常菜',
        difficulty: recipe.difficulty || '简单',
        cookingTime: recipe.cookingTime || '30分钟',
        servings: recipe.servings || 2,
        calories: recipe.calories || '--',
        rating: recipe.rating || 0,
        likeCount: recipe.likeCount || 0,
        viewCount: recipe.viewCount || 0,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        tips: recipe.tips || '',
        author: recipe.author || '',
        sourceUrl: recipe.sourceUrl || '',
        tags: recipe.tags || []
      }

      this.setData({
        dishDetail,
        loading: false
      })

      this.checkSelectedStatus()
    } catch (error) {
      console.error('加载菜品详情失败:', error)

      const { getDishDetail } = require('../../data/dishes.js')
      const fallbackDetail = getDishDetail(parseInt(dishId, 10))

      if (!fallbackDetail) {
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
        }, 1000)
        return
      }

      this.setData({
        dishDetail: fallbackDetail,
        loading: false,
        error: '网络连接失败，已切换到本地菜谱'
      })
    }
  },

  checkSelectedStatus() {
    const selectedIds = new Set(app.getSelectedDishes().map((dish) => dish.id))
    this.setData({
      isSelected: selectedIds.has(this.data.dishDetail.id)
    })
  },

  addToMenu() {
    app.addSelectedDish(this.data.dishDetail)
    this.setData({ isSelected: true })

    wx.showToast({
      title: '已加入菜单',
      icon: 'success'
    })
  },

  removeFromMenu() {
    app.removeSelectedDish(this.data.dishDetail.id)
    this.setData({ isSelected: false })

    wx.showToast({
      title: '已移出菜单',
      icon: 'success'
    })
  },

  shareDish() {
    wx.showActionSheet({
      itemList: ['发送给家人', '复制到剪贴板', '分享给朋友'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.sendWeChatDishMessage(this.data.dishDetail)
        } else if (res.tapIndex === 1) {
          this.copyDishToClipboard(this.data.dishDetail)
        } else if (res.tapIndex === 2) {
          this.shareDishToFriend(this.data.dishDetail)
        }
      }
    })
  },

  sendWeChatDishMessage(dish) {
    wx.showLoading({ title: '发送中...' })

    messageService.sendDishMessage(dish)
      .then((result) => {
        wx.hideLoading()
        wx.showToast({
          title: result.success ? '发送成功' : (result.message || '发送失败'),
          icon: result.success ? 'success' : 'none'
        })
      })
      .catch((error) => {
        wx.hideLoading()
        wx.showToast({
          title: error.message || '发送失败',
          icon: 'none'
        })
      })
  },

  copyDishToClipboard(dish) {
    let content = `推荐一道今晚很适合安排的 ${dish.name}\n\n`
    content += `难度：${dish.difficulty}\n`
    content += `时间：${dish.cookingTime}\n`
    content += `人数：${dish.servings} 人\n\n`
    content += '主要食材：\n'

    dish.ingredients.slice(0, 5).forEach((ingredient) => {
      content += `- ${ingredient.name} ${ingredient.amount}\n`
    })

    if (dish.ingredients.length > 5) {
      content += `...共 ${dish.ingredients.length} 种食材\n`
    }

    messageService.copyToClipboard(content)
      .catch((error) => {
        wx.showToast({
          title: error.message || '复制失败',
          icon: 'none'
        })
      })
  },

  shareDishToFriend(dish) {
    let content = `推荐一道今晚很适合安排的 ${dish.name}\n\n`
    content += `难度：${dish.difficulty}\n`
    content += `时间：${dish.cookingTime}\n`
    content += `人数：${dish.servings} 人\n`

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showModal({
          title: '菜品信息已复制',
          content: '可以直接把这道菜推荐给家人或朋友。',
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

  goBack() {
    wx.navigateBack()
  },

  onShareAppMessage() {
    const dish = this.data.dishDetail
    return {
      title: `推荐一道很适合今晚安排的 ${dish.name}`,
      path: `/pages/detail/detail?id=${dish.id}`
    }
  }
})
