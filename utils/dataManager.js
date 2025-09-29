// utils/dataManager.js
// 数据管理工具

const menuData = require('./menuData.js')

// 初始化数据
function initData() {
  // 检查是否需要更新菜单
  if (menuData.checkMenuUpdate()) {
    updateMenuData()
  }
  
  // 初始化本地存储
  initLocalStorage()
}

// 初始化本地存储
function initLocalStorage() {
  // 初始化已选择菜品
  if (!wx.getStorageSync('selectedDishes')) {
    wx.setStorageSync('selectedDishes', [])
  }
  
  // 初始化菜单数据
  if (!wx.getStorageSync('menuData')) {
    wx.setStorageSync('menuData', menuData.getAllDishes())
  }
  
  // 初始化用户偏好
  if (!wx.getStorageSync('userPreferences')) {
    wx.setStorageSync('userPreferences', {
      favoriteCategories: [],
      difficulty: 'all',
      cookingTime: 'all',
      servings: 2
    })
  }
  
  // 初始化评价历史
  if (!wx.getStorageSync('ratingHistory')) {
    wx.setStorageSync('ratingHistory', [])
  }
}

// 更新菜单数据
function updateMenuData() {
  try {
    // 这里应该从服务器获取最新数据
    // 现在使用本地数据
    const newMenuData = menuData.getAllDishes()
    wx.setStorageSync('menuData', newMenuData)
    
    // 更新最后更新时间
    menuData.updateMenuData()
    
    console.log('菜单数据更新成功')
    return true
  } catch (error) {
    console.error('菜单数据更新失败:', error)
    return false
  }
}

// 获取菜单数据
function getMenuData() {
  return wx.getStorageSync('menuData') || menuData.getAllDishes()
}

// 获取推荐菜品
function getRecommendDishes() {
  const userPreferences = wx.getStorageSync('userPreferences')
  const allDishes = getMenuData()
  
  // 根据用户偏好筛选
  let filteredDishes = allDishes
  
  if (userPreferences.favoriteCategories.length > 0) {
    filteredDishes = filteredDishes.filter(dish => 
      userPreferences.favoriteCategories.includes(dish.categoryType)
    )
  }
  
  if (userPreferences.difficulty !== 'all') {
    filteredDishes = filteredDishes.filter(dish => 
      dish.difficulty === userPreferences.difficulty
    )
  }
  
  // 随机推荐5道菜
  const shuffled = filteredDishes.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, 5)
}

// 保存用户偏好
function saveUserPreferences(preferences) {
  wx.setStorageSync('userPreferences', preferences)
}

// 获取用户偏好
function getUserPreferences() {
  return wx.getStorageSync('userPreferences') || {
    favoriteCategories: [],
    difficulty: 'all',
    cookingTime: 'all',
    servings: 2
  }
}

// 保存评价历史
function saveRatingHistory(rating) {
  const history = wx.getStorageSync('ratingHistory') || []
  history.push({
    ...rating,
    timestamp: new Date().getTime()
  })
  
  // 只保留最近100条记录
  if (history.length > 100) {
    history.splice(0, history.length - 100)
  }
  
  wx.setStorageSync('ratingHistory', history)
}

// 获取评价历史
function getRatingHistory() {
  return wx.getStorageSync('ratingHistory') || []
}

// 获取菜品评价统计
function getDishRatingStats(dishId) {
  const history = getRatingHistory()
  const dishRatings = history.filter(rating => rating.dishId === dishId)
  
  if (dishRatings.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      comments: []
    }
  }
  
  const totalRating = dishRatings.reduce((sum, rating) => sum + rating.rating, 0)
  const averageRating = totalRating / dishRatings.length
  
  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalRatings: dishRatings.length,
    comments: dishRatings.filter(rating => rating.comment.trim()).map(rating => ({
      comment: rating.comment,
      rating: rating.rating,
      timestamp: rating.timestamp
    }))
  }
}

// 搜索菜品
function searchDishes(keyword) {
  const allDishes = getMenuData()
  return allDishes.filter(dish => 
    dish.name.includes(keyword) || 
    dish.description.includes(keyword) ||
    dish.ingredients.some(ingredient => ingredient.name.includes(keyword))
  )
}

// 获取热门菜品
function getPopularDishes() {
  const history = getRatingHistory()
  const dishStats = {}
  
  // 统计每道菜的评价次数和平均评分
  history.forEach(rating => {
    if (!dishStats[rating.dishId]) {
      dishStats[rating.dishId] = {
        totalRatings: 0,
        totalScore: 0,
        comments: 0
      }
    }
    
    dishStats[rating.dishId].totalRatings++
    dishStats[rating.dishId].totalScore += rating.rating
    if (rating.comment.trim()) {
      dishStats[rating.dishId].comments++
    }
  })
  
  // 计算热度分数（评价次数 * 平均评分）
  const popularDishes = Object.keys(dishStats).map(dishId => {
    const stats = dishStats[dishId]
    const averageRating = stats.totalScore / stats.totalRatings
    const popularityScore = stats.totalRatings * averageRating
    
    return {
      dishId: parseInt(dishId),
      popularityScore,
      averageRating,
      totalRatings: stats.totalRatings
    }
  })
  
  // 按热度排序
  popularDishes.sort((a, b) => b.popularityScore - a.popularityScore)
  
  // 获取菜品详情
  const allDishes = getMenuData()
  return popularDishes.slice(0, 10).map(item => {
    const dish = allDishes.find(d => d.id === item.dishId)
    return {
      ...dish,
      popularityScore: item.popularityScore,
      averageRating: item.averageRating,
      totalRatings: item.totalRatings
    }
  }).filter(dish => dish)
}

// 清理过期数据
function cleanupExpiredData() {
  const now = new Date().getTime()
  const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000)
  
  // 清理过期的评价历史
  const history = getRatingHistory()
  const filteredHistory = history.filter(rating => rating.timestamp > oneMonthAgo)
  wx.setStorageSync('ratingHistory', filteredHistory)
  
  console.log('过期数据清理完成')
}

// 导出数据
function exportData() {
  const data = {
    selectedDishes: wx.getStorageSync('selectedDishes'),
    userPreferences: wx.getStorageSync('userPreferences'),
    ratingHistory: wx.getStorageSync('ratingHistory'),
    exportTime: new Date().getTime()
  }
  
  return JSON.stringify(data, null, 2)
}

// 导入数据
function importData(jsonData) {
  try {
    const data = JSON.parse(jsonData)
    
    if (data.selectedDishes) {
      wx.setStorageSync('selectedDishes', data.selectedDishes)
    }
    
    if (data.userPreferences) {
      wx.setStorageSync('userPreferences', data.userPreferences)
    }
    
    if (data.ratingHistory) {
      wx.setStorageSync('ratingHistory', data.ratingHistory)
    }
    
    return true
  } catch (error) {
    console.error('数据导入失败:', error)
    return false
  }
}

module.exports = {
  initData,
  updateMenuData,
  getMenuData,
  getRecommendDishes,
  saveUserPreferences,
  getUserPreferences,
  saveRatingHistory,
  getRatingHistory,
  getDishRatingStats,
  searchDishes,
  getPopularDishes,
  cleanupExpiredData,
  exportData,
  importData
}
