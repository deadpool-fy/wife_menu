// pages/category/category.js
const app = getApp()
const cloudApiService = require('../../utils/cloudApi.js')

Page({
  data: {
    currentCategory: 'all',
    categoryName: '全部',
    allDishes: [],
    filteredDishes: [],
    selectedCount: 0,
    loading: false,
    error: null,
    categories: [
      { id: 'all', name: '全部', icon: '🍽️' },
      { id: 'meat', name: '荤菜', icon: '🥩' },
      { id: 'vegetable', name: '素菜', icon: '🥬' },
      { id: 'mixed', name: '荤素搭配', icon: '🥘' },
      { id: 'soup', name: '汤类', icon: '🍲' },
      { id: 'dessert', name: '甜品', icon: '🍰' }
    ]
  },

  onLoad() {
    this.loadAllDishes()
    this.loadSelectedDishes()
  },

  onShow() {
    this.loadSelectedDishes()
    this.updateSelectedStatus()
  },

  // 加载所有菜品数据
  async loadAllDishes() {
    this.setData({ loading: true, error: null })
    
    try {
      // 从云开发获取所有菜品
      const response = await cloudApiService.getRecipes({ 
        page: 1, 
        limit: 100
      })
      
      if (response.success) {
        // 转换数据格式以适配小程序
        const allDishes = response.data.recipes.map(recipe => ({
          id: recipe._id,
          name: recipe.title,
          category: recipe.category,
          categoryType: this.getCategoryType(recipe.category),
          difficulty: recipe.difficulty,
          cookingTime: recipe.cookingTime,
          servings: recipe.servings,
          calories: recipe.calories,
          rating: recipe.rating,
          likeCount: recipe.likeCount,
          image: recipe.image || '/images/default-dish.png',
          selected: false
        }))
        
        this.setData({
          allDishes: allDishes,
          filteredDishes: allDishes,
          loading: false
        })
        
        // 更新选中状态
        this.updateSelectedStatus()
      } else {
        throw new Error(response.message || '获取菜品数据失败')
      }
    } catch (error) {
      console.error('加载菜品数据失败:', error)
      
      // 如果云开发失败，使用本地数据作为备用
      const mockDishes = this.getMockDishes()
      
      this.setData({
        allDishes: mockDishes,
        filteredDishes: mockDishes,
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

  // 获取分类类型映射
  getCategoryType(category) {
    const categoryMap = {
      '荤菜': 'meat',
      '素菜': 'vegetable', 
      '荤素搭配': 'mixed',
      '汤类': 'soup',
      '甜品': 'dessert'
    }
    return categoryMap[category] || 'mixed'
  },

  // 获取模拟数据（备用）
  getMockDishes() {
    return [
      {
        id: 1,
        name: '宫保鸡丁',
        category: '荤菜',
        categoryType: 'meat',
        difficulty: '中等',
        cookingTime: '30分钟',
        servings: 2,
        image: 'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=宫保鸡丁',
        selected: false
      },
      {
        id: 2,
        name: '麻婆豆腐',
        category: '素菜',
        categoryType: 'vegetable',
        difficulty: '简单',
        cookingTime: '20分钟',
        servings: 2,
        image: 'https://via.placeholder.com/300x200/4ecdc4/ffffff?text=麻婆豆腐',
        selected: false
      },
      {
        id: 3,
        name: '红烧肉',
        category: '荤菜',
        categoryType: 'meat',
        difficulty: '中等',
        cookingTime: '45分钟',
        servings: 3,
        image: 'https://via.placeholder.com/300x200/45b7d1/ffffff?text=红烧肉',
        selected: false
      },
      {
        id: 4,
        name: '清炒小白菜',
        category: '素菜',
        categoryType: 'vegetable',
        difficulty: '简单',
        cookingTime: '10分钟',
        servings: 2,
        image: 'https://via.placeholder.com/300x200/96ceb4/ffffff?text=清炒小白菜',
        selected: false
      },
      {
        id: 5,
        name: '糖醋里脊',
        category: '荤菜',
        categoryType: 'meat',
        difficulty: '中等',
        cookingTime: '35分钟',
        servings: 2,
        image: 'https://via.placeholder.com/300x200/feca57/ffffff?text=糖醋里脊',
        selected: false
      },
      {
        id: 6,
        name: '西红柿鸡蛋',
        category: '荤素搭配',
        categoryType: 'mixed',
        difficulty: '简单',
        cookingTime: '15分钟',
        servings: 2,
        image: 'https://via.placeholder.com/300x200/ff9ff3/ffffff?text=西红柿鸡蛋',
        selected: false
      },
      {
        id: 7,
        name: '酸辣土豆丝',
        category: '素菜',
        categoryType: 'vegetable',
        difficulty: '简单',
        cookingTime: '15分钟',
        servings: 2,
        image: 'https://via.placeholder.com/300x200/54a0ff/ffffff?text=酸辣土豆丝',
        selected: false
      },
      {
        id: 8,
        name: '鱼香肉丝',
        category: '荤素搭配',
        categoryType: 'mixed',
        difficulty: '中等',
        cookingTime: '25分钟',
        servings: 2,
        image: 'https://via.placeholder.com/300x200/5f27cd/ffffff?text=鱼香肉丝',
        selected: false
      },
      {
        id: 9,
        name: '紫菜蛋花汤',
        category: '汤类',
        categoryType: 'soup',
        difficulty: '简单',
        cookingTime: '10分钟',
        servings: 3,
        image: 'https://via.placeholder.com/300x200/00d2d3/ffffff?text=紫菜蛋花汤',
        selected: false
      },
      {
        id: 10,
        name: '银耳莲子汤',
        category: '甜品',
        categoryType: 'dessert',
        difficulty: '简单',
        cookingTime: '60分钟',
        servings: 4,
        image: 'https://via.placeholder.com/300x200/ff6348/ffffff?text=银耳莲子汤',
        selected: false
      }
    ]
  },

  // 加载已选择的菜品
  loadSelectedDishes() {
    const selectedDishes = app.getSelectedDishes()
    this.setData({
      selectedCount: selectedDishes.length
    })
  },

  // 更新选中状态
  updateSelectedStatus() {
    const selectedDishes = app.getSelectedDishes()
    const allDishes = this.data.allDishes.map(dish => {
      const isSelected = selectedDishes.some(selected => selected.id === dish.id)
      return { ...dish, selected: isSelected }
    })
    
    this.setData({
      allDishes: allDishes
    })
    
    this.filterDishes()
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    const categoryNames = {
      'all': '全部',
      'meat': '荤菜',
      'vegetable': '素菜',
      'mixed': '荤素搭配',
      'soup': '汤类',
      'dessert': '甜品'
    }
    
    this.setData({
      currentCategory: category,
      categoryName: categoryNames[category]
    })
    
    this.filterDishes()
  },

  // 筛选菜品
  filterDishes() {
    const { currentCategory, allDishes } = this.data
    let filteredDishes = allDishes
    
    if (currentCategory !== 'all') {
      filteredDishes = allDishes.filter(dish => dish.categoryType === currentCategory)
    }
    
    this.setData({
      filteredDishes: filteredDishes
    })
  },

  // 跳转到详情页
  goToDetail(e) {
    const dish = e.currentTarget.dataset.dish
    wx.navigateTo({
      url: `/pages/detail/detail?id=${dish.id}`
    })
  },

  // 切换选择状态
  toggleSelect(e) {
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
    this.updateSelectedStatus()
  },

  // 跳转到菜单页面
  goToMenu() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
