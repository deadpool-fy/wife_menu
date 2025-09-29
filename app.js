// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-5ga4h58zc0ea35dc', // 替换为实际环境ID
        traceUser: true
      })
    }

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  
  globalData: {
    userInfo: null,
    selectedDishes: [], // 已选择的菜品
    menuData: [] // 菜单数据
  },

  // 添加选中的菜品
  addSelectedDish(dish) {
    const selectedDishes = this.globalData.selectedDishes
    const existingIndex = selectedDishes.findIndex(item => item.id === dish.id)
    
    if (existingIndex === -1) {
      selectedDishes.push(dish)
    }
    
    this.globalData.selectedDishes = selectedDishes
    wx.setStorageSync('selectedDishes', selectedDishes)
  },

  // 移除选中的菜品
  removeSelectedDish(dishId) {
    const selectedDishes = this.globalData.selectedDishes.filter(item => item.id !== dishId)
    this.globalData.selectedDishes = selectedDishes
    wx.setStorageSync('selectedDishes', selectedDishes)
  },

  // 清空选中的菜品
  clearSelectedDishes() {
    this.globalData.selectedDishes = []
    wx.removeStorageSync('selectedDishes')
  },

  // 获取选中的菜品
  getSelectedDishes() {
    return this.globalData.selectedDishes
  }
})
