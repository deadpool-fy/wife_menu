const app = getApp()
const messageService = require('../../utils/messageService.js')
const cloudApiService = require('../../utils/cloudApi.js')

Page({
  data: {
    currentDate: '',
    selectedDishes: [],
    recommendDishes: [],
    loading: false,
    error: null,
    todayMood: '适合安排一顿有仪式感的家常晚餐',
    heroTip: '从推荐里挑几道顺眼的，立刻就能拼出一份像认真准备过的菜单。',
    sharePanelVisible: false,
    shareTitle: '',
    shareSummary: '',
    sharePath: '/pages/index/index'
  },

  onLoad() {
    this.setCurrentDate()
    this.loadSelectedDishes()
    this.loadRecommendDishes()
  },

  onShow() {
    this.loadSelectedDishes()
    this.updateRecommendDishes()
    this.syncTabBar()
  },

  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setSelected(0)
    }
  },

  setCurrentDate() {
    const now = new Date()
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']

    this.setData({
      currentDate: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekdays[now.getDay()]}`
    })
  },

  loadSelectedDishes() {
    this.setData({
      selectedDishes: app.getSelectedDishes()
    })
  },

  async loadRecommendDishes() {
    this.setData({ loading: true, error: null })

    try {
      const response = await cloudApiService.getRecommendRecipes(20)

      if (!response.success) {
        throw new Error(response.message || '获取推荐菜品失败')
      }

      const recommendDishes = response.data.map((recipe, index) => ({
        id: recipe._id,
        name: recipe.title,
        image: recipe.image || '/images/default-dish.png',
        category: recipe.category || '家常菜',
        difficulty: recipe.difficulty || '简单',
        cookingTime: recipe.cookingTime || '30分钟',
        calories: recipe.calories || '--',
        servings: recipe.servings || 2,
        rating: recipe.rating || 0,
        likeCount: recipe.likeCount || 0,
        selected: false,
        isNew: index < 2
      }))

      this.setData({
        recommendDishes,
        loading: false
      })

      this.updateRecommendDishes()
    } catch (error) {
      console.error('加载推荐菜品失败:', error)

      if (String(error.message || '').includes('collection') || String(error.message || '').includes('not found')) {
        await this.initDatabase()
        return
      }

      const { getRecommendDishes } = require('../../data/dishes.js')
      const fallbackDishes = getRecommendDishes().map((dish, index) => ({
        ...dish,
        difficulty: dish.difficulty || '简单',
        cookingTime: dish.cookingTime || '30分钟',
        servings: dish.servings || 2,
        rating: dish.rating || 0,
        likeCount: dish.likeCount || 0,
        isNew: index < 2
      }))

      this.setData({
        recommendDishes: fallbackDishes,
        loading: false,
        error: '网络连接失败，已切换到本地菜谱'
      })

      wx.showToast({
        title: '已切换到本地菜谱',
        icon: 'none',
        duration: 1800
      })
    }
  },

  async initDatabase() {
    try {
      wx.showLoading({ title: '正在初始化数据...' })

      const result = await wx.cloud.callFunction({
        name: 'init-database'
      })

      wx.hideLoading()

      if (!result.result.success) {
        throw new Error(result.result.message || '初始化失败')
      }

      wx.showToast({
        title: '数据初始化成功',
        icon: 'success'
      })

      await this.loadRecommendDishes()
    } catch (error) {
      wx.hideLoading()
      console.error('数据库初始化失败:', error)

      wx.showModal({
        title: '初始化失败',
        content: '请检查云开发环境配置后再试。',
        showCancel: false
      })
    }
  },

  updateRecommendDishes() {
    const selectedIds = new Set(this.data.selectedDishes.map((dish) => dish.id))

    this.setData({
      recommendDishes: this.data.recommendDishes.map((dish) => ({
        ...dish,
        selected: selectedIds.has(dish.id)
      }))
    })
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  selectDish(e) {
    const dish = e.currentTarget.dataset.dish

    if (dish.selected) {
      app.removeSelectedDish(dish.id)
      wx.showToast({
        title: '已移出菜单',
        icon: 'success'
      })
    } else {
      app.addSelectedDish(dish)
      wx.showToast({
        title: '已加入菜单',
        icon: 'success'
      })
    }

    this.loadSelectedDishes()
    this.updateRecommendDishes()
  },

  removeDish(e) {
    app.removeSelectedDish(e.currentTarget.dataset.id)
    this.loadSelectedDishes()
    this.updateRecommendDishes()

    wx.showToast({
      title: '已移除',
      icon: 'success'
    })
  },

  clearSelected() {
    wx.showModal({
      title: '清空已选菜单',
      content: '确定要移除当前已选的所有菜品吗？',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        app.clearSelectedDishes()
        this.loadSelectedDishes()
        this.updateRecommendDishes()

        wx.showToast({
          title: '已清空',
          icon: 'success'
        })
      }
    })
  },

  refreshRecommend() {
    this.loadRecommendDishes()
  },

  sendToWeChat() {
    const selectedDishes = this.data.selectedDishes

    if (!selectedDishes.length) {
      wx.showToast({
        title: '请先选择菜品',
        icon: 'none'
      })
      return
    }

    wx.showActionSheet({
      itemList: ['发送给家人', '复制到剪贴板', '分享给朋友'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.sendWeChatMessage(selectedDishes)
        } else if (res.tapIndex === 1) {
          this.copyMenuToClipboard(selectedDishes)
        } else if (res.tapIndex === 2) {
          this.shareMenuToFriend(selectedDishes)
        }
      }
    })
  },

  sendWeChatMessage(selectedDishes) {
    wx.showLoading({ title: '发送中...' })

    messageService.sendMenuMessage(selectedDishes, this.data.currentDate)
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
          title: '发送成功',
          icon: 'success'
        })

        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/rating/rating'
          })
        }, 1200)
      })
      .catch((error) => {
        wx.hideLoading()

        if (error.errCode === -604101) {
          wx.showModal({
            title: '权限不足',
            content: `${error.message}\n\n${error.solution || ''}`,
            showCancel: false
          })
          return
        }

        wx.showToast({
          title: error.message || '发送失败',
          icon: 'none'
        })
      })
  },

  copyMenuToClipboard(selectedDishes) {
    let content = '今日菜单：\n\n'

    selectedDishes.forEach((dish, index) => {
      content += `${index + 1}. ${dish.name}\n`
    })

    content += `\n时间：${this.data.currentDate}`

    messageService.copyToClipboard(content)
      .then(() => {
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/rating/rating'
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

  shareMenuToFriend(selectedDishes) {
    const dishNames = selectedDishes.map((dish) => dish.name)
    const summary = dishNames.slice(0, 4).join('、')
    const shareTitle = dishNames.length > 2
      ? `今晚想做 ${dishNames[0]}、${dishNames[1]}，帮我看看这份菜单怎么样`
      : `今晚吃什么？我选了 ${dishNames.join('、')}`

    this.setData({
      sharePanelVisible: true,
      shareTitle,
      shareSummary: summary,
      sharePath: `/pages/index/index?from=share&menu=${encodeURIComponent(dishNames.join(','))}`
    })
  },

  closeSharePanel() {
    this.setData({
      sharePanelVisible: false
    })
  },

  goToAdmin() {
    wx.navigateTo({
      url: '/pages/admin/admin'
    })
  },

  onShareAppMessage() {
    const { shareTitle, shareSummary, sharePath } = this.data
    return {
      title: shareTitle || '今晚吃什么？来这里挑一份更好看的家庭菜单',
      desc: shareSummary || '我在这里整理了一份更顺眼的晚餐菜单，打开就能直接选。',
      path: sharePath || '/pages/index/index'
    }
  }
})
