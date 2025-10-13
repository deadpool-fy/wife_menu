// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'cloud1-5ga4h58zc0ea35dc', // 请替换为你的环境ID
        traceUser: true,
      });
    }

    // 获取用户信息
    this.getUserInfo();
  },

  // 获取用户信息
  getUserInfo() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo;
              
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res);
              }
            }
          });
        }
      }
    });
  },

  // 全局数据
  globalData: {
    userInfo: null,
    selectedDishes: [],
    userFavorites: [],
    userRatings: []
  },

  // 获取已选择的菜品
  getSelectedDishes() {
    return this.globalData.selectedDishes || [];
  },

  // 添加选择的菜品
  addSelectedDish(dish) {
    const selectedDishes = this.getSelectedDishes();
    const exists = selectedDishes.some(item => item.id === dish.id);
    
    if (!exists) {
      selectedDishes.push(dish);
      this.globalData.selectedDishes = selectedDishes;
      
      // 保存到本地存储
      wx.setStorageSync('selectedDishes', selectedDishes);
    }
  },

  // 移除选择的菜品
  removeSelectedDish(dishId) {
    const selectedDishes = this.getSelectedDishes();
    const filtered = selectedDishes.filter(item => item.id !== dishId);
    this.globalData.selectedDishes = filtered;
    
    // 保存到本地存储
    wx.setStorageSync('selectedDishes', filtered);
  },

  // 清空选择的菜品
  clearSelectedDishes() {
    this.globalData.selectedDishes = [];
    wx.removeStorageSync('selectedDishes');
  },

  // 获取用户收藏
  getUserFavorites() {
    return this.globalData.userFavorites || [];
  },

  // 添加用户收藏
  addUserFavorite(recipe) {
    const favorites = this.getUserFavorites();
    const exists = favorites.some(item => item.recipeId === recipe.id);
    
    if (!exists) {
      favorites.push({
        recipeId: recipe.id,
        recipeData: recipe,
        createdAt: new Date()
      });
      this.globalData.userFavorites = favorites;
      
      // 保存到本地存储
      wx.setStorageSync('userFavorites', favorites);
    }
  },

  // 移除用户收藏
  removeUserFavorite(recipeId) {
    const favorites = this.getUserFavorites();
    const filtered = favorites.filter(item => item.recipeId !== recipeId);
    this.globalData.userFavorites = filtered;
    
    // 保存到本地存储
    wx.setStorageSync('userFavorites', filtered);
  },

  // 检查是否已收藏
  isFavorite(recipeId) {
    const favorites = this.getUserFavorites();
    return favorites.some(item => item.recipeId === recipeId);
  },

  // 获取用户评分
  getUserRatings() {
    return this.globalData.userRatings || [];
  },

  // 添加用户评分
  addUserRating(recipeId, rating, comment = '') {
    const ratings = this.getUserRatings();
    const existingIndex = ratings.findIndex(item => item.recipeId === recipeId);
    
    if (existingIndex >= 0) {
      ratings[existingIndex] = {
        recipeId,
        rating,
        comment,
        updatedAt: new Date()
      };
    } else {
      ratings.push({
        recipeId,
        rating,
        comment,
        createdAt: new Date()
      });
    }
    
    this.globalData.userRatings = ratings;
    
    // 保存到本地存储
    wx.setStorageSync('userRatings', ratings);
  },

  // 获取用户对某个菜谱的评分
  getUserRating(recipeId) {
    const ratings = this.getUserRatings();
    const rating = ratings.find(item => item.recipeId === recipeId);
    return rating ? rating.rating : 0;
  },

  // 初始化本地数据
  initLocalData() {
    // 从本地存储恢复数据
    try {
      const selectedDishes = wx.getStorageSync('selectedDishes');
      if (selectedDishes) {
        this.globalData.selectedDishes = selectedDishes;
      }
      
      const userFavorites = wx.getStorageSync('userFavorites');
      if (userFavorites) {
        this.globalData.userFavorites = userFavorites;
      }
      
      const userRatings = wx.getStorageSync('userRatings');
      if (userRatings) {
        this.globalData.userRatings = userRatings;
      }
    } catch (error) {
      console.error('初始化本地数据失败:', error);
    }
  }
});