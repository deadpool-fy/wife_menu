// pages/index/index.js
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
    weatherInfo: '晴天 22°C'
  },

  onLoad() {
    this.setCurrentDate()
    this.loadSelectedDishes()
    this.loadRecommendDishes()
  },

  onShow() {
    this.loadSelectedDishes()
    this.updateRecommendDishes()
  },

  // 设置当前日期
  setCurrentDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const weekday = weekdays[now.getDay()]
    
    this.setData({
      currentDate: `${year}年${month}月${day}日 星期${weekday}`
    })
  },

  // 加载已选择的菜品
  loadSelectedDishes() {
    const selectedDishes = app.getSelectedDishes()
    this.setData({
      selectedDishes: selectedDishes
    })
  },

  // 加载推荐菜品
  async loadRecommendDishes() {
    this.setData({ loading: true, error: null })
    
    try {
      // 从云开发获取推荐菜品
      const response = await cloudApiService.getRecommendRecipes(20)
      
      if (response.success) {
        // 转换数据格式以适配小程序
        const recommendDishes = response.data.map(recipe => ({
          id: recipe._id,
          name: recipe.title,
          image: recipe.image || '/images/default-dish.png',
          category: recipe.category,
          difficulty: recipe.difficulty,
          cookingTime: recipe.cookingTime,
          calories: recipe.calories,
          servings: recipe.servings,
          rating: recipe.rating,
          likeCount: recipe.likeCount,
          selected: false
        }))
        
        this.setData({
          recommendDishes: recommendDishes,
          loading: false
        })
        
        // 更新推荐菜品的选中状态
        this.updateRecommendDishes()
      } else {
        throw new Error(response.message || '获取推荐菜品失败')
      }
    } catch (error) {
      console.error('加载推荐菜品失败:', error)
      
      // 检查是否需要初始化数据库
      if (error.message.includes('collection') || error.message.includes('not found')) {
        await this.initDatabase();
        return;
      }
      
      // 如果云开发失败，使用本地数据作为备用
      const { getRecommendDishes } = require('../../data/dishes.js')
      const fallbackDishes = getRecommendDishes()
      
      this.setData({
        recommendDishes: fallbackDishes,
        loading: false,
        error: '网络连接失败，已加载本地数据'
      })
      
      wx.showToast({
        title: '网络连接失败，已加载本地数据',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 初始化数据库
  async initDatabase() {
    try {
      wx.showLoading({
        title: '正在初始化数据库...'
      });
      
      // 调用云函数初始化数据库
      const result = await wx.cloud.callFunction({
        name: 'init-database'
      });
      
      wx.hideLoading();
      
      if (result.result.success) {
        wx.showToast({
          title: '数据库初始化成功',
          icon: 'success'
        });
        
        // 重新加载推荐菜品
        await this.loadRecommendDishes();
      } else {
        throw new Error(result.result.message || '初始化失败');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('数据库初始化失败:', error);
      
      wx.showModal({
        title: '数据库初始化失败',
        content: '请检查云开发环境配置，或联系技术支持',
        showCancel: false,
        confirmText: '确定'
      });
    }
  },

  // 更新推荐菜品的选中状态
  updateRecommendDishes() {
    const selectedDishes = this.data.selectedDishes
    const recommendDishes = this.data.recommendDishes.map(dish => {
      const isSelected = selectedDishes.some(selected => selected.id === dish.id)
      return { ...dish, selected: isSelected }
    })
    
    this.setData({
      recommendDishes: recommendDishes
    })
  },

  // 跳转到详情页
  goToDetail(e) {
    const dish = e.currentTarget.dataset.dish
    wx.navigateTo({
      url: `/pages/detail/detail?id=${dish.id}`
    })
  },

  // 选择菜品
  selectDish(e) {
    const dish = e.currentTarget.dataset.dish
    
    if (dish.selected) {
      // 如果已选中，则取消选择
      app.removeSelectedDish(dish.id)
      wx.showToast({
        title: '已取消选择',
        icon: 'success'
      })
    } else {
      // 如果未选中，则添加到选择列表
      app.addSelectedDish(dish)
      wx.showToast({
        title: '已添加到菜单',
        icon: 'success'
      })
    }
    
    this.loadSelectedDishes()
    this.updateRecommendDishes()
  },

  // 移除菜品
  removeDish(e) {
    const dishId = e.currentTarget.dataset.id
    app.removeSelectedDish(dishId)
    this.loadSelectedDishes()
    this.updateRecommendDishes()
    
    wx.showToast({
      title: '已移除',
      icon: 'success'
    })
  },

  // 清空已选菜品
  clearSelected() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有已选择的菜品吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearSelectedDishes()
          this.loadSelectedDishes()
          this.updateRecommendDishes()
          
          wx.showToast({
            title: '已清空',
            icon: 'success'
          })
        }
      }
    })
  },

  // 发送到微信
  sendToWeChat() {
    const selectedDishes = this.data.selectedDishes
    
    if (selectedDishes.length === 0) {
      wx.showToast({
        title: '请先选择菜品',
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
            this.sendWeChatMessage(selectedDishes)
            break
          case 1:
            this.copyMenuToClipboard(selectedDishes)
            break
          case 2:
            this.shareMenuToFriend(selectedDishes)
            break
        }
      }
    })
  },

  // 发送微信消息
  sendWeChatMessage(selectedDishes) {
    wx.showLoading({
      title: '发送中...'
    })

    messageService.sendMenuMessage(selectedDishes, this.data.currentDate)
      .then((result) => {
        wx.hideLoading()
        if (result.success) {
          wx.showToast({
            title: '发送成功',
            icon: 'success'
          })
          // 发送成功后跳转到评分页面
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/rating/rating'
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
        console.log('发送失败:', error)
        
        // 权限错误特殊处理
        if (error.errCode === -604101) {
          wx.showModal({
            title: '权限不足',
            content: `${error.message}\n\n解决方案：${error.solution}`,
            showCancel: false,
            confirmText: '知道了'
          })
        } else {
          wx.showToast({
            title: error.message || '发送失败',
            icon: 'none'
          })
        }
      })
  },

  // 复制到剪贴板
  copyMenuToClipboard(selectedDishes) {
    let shareContent = `今天中午的菜单：\n\n`
    selectedDishes.forEach((dish, index) => {
      shareContent += `${index + 1}. ${dish.name}\n`
    })
    shareContent += `\n时间：${this.data.currentDate}`

    messageService.copyToClipboard(shareContent)
      .then(() => {
        // 复制成功后跳转到评分页面
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/rating/rating'
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

  // 分享给朋友
  shareMenuToFriend(selectedDishes) {
    let shareContent = `今天中午的菜单：\n\n`
    selectedDishes.forEach((dish, index) => {
      shareContent += `${index + 1}. ${dish.name}\n`
    })
    shareContent += `\n时间：${this.data.currentDate}`

    // 复制到剪贴板
    wx.setClipboardData({
      data: shareContent,
      success: () => {
        wx.showModal({
          title: '菜单已复制',
          content: '菜单已复制到剪贴板，您可以分享给朋友或发送给家人',
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

  // 分享给朋友
  onShareAppMessage() {
    const selectedDishes = this.data.selectedDishes
    let shareContent = `今天中午的菜单：\n\n`
    selectedDishes.forEach((dish, index) => {
      shareContent += `${index + 1}. ${dish.name}\n`
    })
    
    return {
      title: '今天中午吃什么？',
      desc: shareContent,
      path: '/pages/index/index'
    }
  },


  // 跳转到管理页面
  goToAdmin() {
    wx.navigateTo({
      url: '/pages/admin/admin'
    });
  }
})
