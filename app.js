const secureConfig = require('./config/secureConfig.js')
const cloudApiService = require('./utils/cloudApi.js')

App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      const cloudOptions = {
        traceUser: true
      }

      if (secureConfig.cloudEnvId && secureConfig.cloudEnvId !== 'cloud1-your-env-id') {
        cloudOptions.env = secureConfig.cloudEnvId
      }

      wx.cloud.init(cloudOptions)
    }

    this.initLocalData()
    this.getUserInfo()
    this.ensureAdminStatus()
  },

  getUserInfo() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: (infoRes) => {
              this.globalData.userInfo = infoRes.userInfo
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(infoRes)
              }
            }
          })
        }
      }
    })
  },

  globalData: {
    userInfo: null,
    selectedDishes: [],
    userFavorites: [],
    userRatings: [],
    isAdmin: false,
    adminOpenId: ''
  },

  async ensureAdminStatus(forceRefresh = false) {
    if (!forceRefresh && typeof this.globalData.isAdmin === 'boolean' && this.globalData.adminOpenId) {
      return {
        isAdmin: this.globalData.isAdmin,
        openId: this.globalData.adminOpenId
      }
    }

    try {
      const result = await cloudApiService.getAdminAccess()
      const data = (result && result.success && result.data) ? result.data : {}
      this.globalData.isAdmin = !!data.isAdmin
      this.globalData.adminOpenId = data.openId || ''
      return {
        isAdmin: this.globalData.isAdmin,
        openId: this.globalData.adminOpenId
      }
    } catch (error) {
      console.error('获取管理员状态失败:', error)
      this.globalData.isAdmin = false
      this.globalData.adminOpenId = ''
      return {
        isAdmin: false,
        openId: ''
      }
    }
  },

  getSelectedDishes() {
    return this.globalData.selectedDishes || []
  },

  addSelectedDish(dish) {
    const selectedDishes = this.getSelectedDishes()
    const exists = selectedDishes.some((item) => item.id === dish.id)

    if (!exists) {
      selectedDishes.push(dish)
      this.globalData.selectedDishes = selectedDishes
      wx.setStorageSync('selectedDishes', selectedDishes)
    }
  },

  removeSelectedDish(dishId) {
    const selectedDishes = this.getSelectedDishes()
    const filtered = selectedDishes.filter((item) => item.id !== dishId)
    this.globalData.selectedDishes = filtered
    wx.setStorageSync('selectedDishes', filtered)
  },

  clearSelectedDishes() {
    this.globalData.selectedDishes = []
    wx.removeStorageSync('selectedDishes')
  },

  getUserFavorites() {
    return this.globalData.userFavorites || []
  },

  addUserFavorite(recipe) {
    const favorites = this.getUserFavorites()
    const exists = favorites.some((item) => item.recipeId === recipe.id)

    if (!exists) {
      favorites.push({
        recipeId: recipe.id,
        recipeData: recipe,
        createdAt: new Date()
      })
      this.globalData.userFavorites = favorites
      wx.setStorageSync('userFavorites', favorites)
    }
  },

  removeUserFavorite(recipeId) {
    const favorites = this.getUserFavorites()
    const filtered = favorites.filter((item) => item.recipeId !== recipeId)
    this.globalData.userFavorites = filtered
    wx.setStorageSync('userFavorites', filtered)
  },

  isFavorite(recipeId) {
    return this.getUserFavorites().some((item) => item.recipeId === recipeId)
  },

  getUserRatings() {
    return this.globalData.userRatings || []
  },

  addUserRating(recipeId, rating, comment = '') {
    const ratings = this.getUserRatings()
    const existingIndex = ratings.findIndex((item) => item.recipeId === recipeId)

    if (existingIndex >= 0) {
      ratings[existingIndex] = {
        recipeId,
        rating,
        comment,
        updatedAt: new Date()
      }
    } else {
      ratings.push({
        recipeId,
        rating,
        comment,
        createdAt: new Date()
      })
    }

    this.globalData.userRatings = ratings
    wx.setStorageSync('userRatings', ratings)
  },

  getUserRating(recipeId) {
    const rating = this.getUserRatings().find((item) => item.recipeId === recipeId)
    return rating ? rating.rating : 0
  },

  initLocalData() {
    try {
      const selectedDishes = wx.getStorageSync('selectedDishes')
      if (selectedDishes) {
        this.globalData.selectedDishes = selectedDishes
      }

      const userFavorites = wx.getStorageSync('userFavorites')
      if (userFavorites) {
        this.globalData.userFavorites = userFavorites
      }

      const userRatings = wx.getStorageSync('userRatings')
      if (userRatings) {
        this.globalData.userRatings = userRatings
      }
    } catch (error) {
      console.error('初始化本地数据失败:', error)
    }
  }
})
