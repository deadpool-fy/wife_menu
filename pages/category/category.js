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
      { id: 'all', name: '全部', icon: '全' },
      { id: 'meat', name: '荤菜', icon: '肉' },
      { id: 'vegetable', name: '素菜', icon: '素' },
      { id: 'mixed', name: '搭配', icon: '拼' },
      { id: 'soup', name: '汤品', icon: '汤' },
      { id: 'dessert', name: '甜品', icon: '甜' }
    ]
  },

  onLoad() {
    this.loadAllDishes()
    this.loadSelectedDishes()
  },

  onShow() {
    this.loadSelectedDishes()
    this.updateSelectedStatus()
    this.syncTabBar()
  },

  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setSelected(1)
    }
  },

  async loadAllDishes() {
    this.setData({ loading: true, error: null })

    try {
      const response = await cloudApiService.getRecipes({
        page: 1,
        limit: 100
      })

      if (!response.success) {
        throw new Error(response.message || '获取菜品数据失败')
      }

      const allDishes = response.data.recipes.map((recipe) => ({
        id: recipe._id,
        name: recipe.title,
        category: recipe.category || '家常菜',
        categoryType: this.getCategoryType(recipe.category),
        difficulty: recipe.difficulty || '简单',
        cookingTime: recipe.cookingTime || '30分钟',
        servings: recipe.servings || 2,
        calories: recipe.calories || '--',
        rating: recipe.rating || 0,
        likeCount: recipe.likeCount || 0,
        image: recipe.image || '/images/default-dish.png',
        selected: false
      }))

      this.setData({
        allDishes,
        filteredDishes: allDishes,
        loading: false
      })

      this.updateSelectedStatus()
    } catch (error) {
      console.error('加载菜品数据失败:', error)

      const mockDishes = this.getMockDishes()

      this.setData({
        allDishes: mockDishes,
        filteredDishes: mockDishes,
        loading: false,
        error: '网络连接失败，已切换到本地菜谱'
      })
    }
  },

  getCategoryType(category) {
    const categoryMap = {
      荤菜: 'meat',
      素菜: 'vegetable',
      荤素搭配: 'mixed',
      汤类: 'soup',
      汤品: 'soup',
      甜品: 'dessert'
    }

    return categoryMap[category] || 'mixed'
  },

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
        calories: 420,
        image: 'https://via.placeholder.com/300x200/214033/fffaf4?text=%E5%AE%AB%E4%BF%9D%E9%B8%A1%E4%B8%81',
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
        calories: 290,
        image: 'https://via.placeholder.com/300x200/d96b4d/fffaf4?text=%E9%BA%BB%E5%A9%86%E8%B1%86%E8%85%90',
        selected: false
      },
      {
        id: 3,
        name: '番茄牛腩',
        category: '荤菜',
        categoryType: 'meat',
        difficulty: '中等',
        cookingTime: '50分钟',
        servings: 3,
        calories: 510,
        image: 'https://via.placeholder.com/300x200/7ea68a/fffaf4?text=%E7%95%AA%E8%8C%84%E7%89%9B%E8%85%A9',
        selected: false
      },
      {
        id: 4,
        name: '清炒时蔬',
        category: '素菜',
        categoryType: 'vegetable',
        difficulty: '简单',
        cookingTime: '12分钟',
        servings: 2,
        calories: 160,
        image: 'https://via.placeholder.com/300x200/f1c27d/214033?text=%E6%B8%85%E7%82%92%E6%97%B6%E8%94%AC',
        selected: false
      },
      {
        id: 5,
        name: '菌菇鸡汤',
        category: '汤品',
        categoryType: 'soup',
        difficulty: '简单',
        cookingTime: '40分钟',
        servings: 3,
        calories: 220,
        image: 'https://via.placeholder.com/300x200/bf5638/fffaf4?text=%E8%8F%8C%E8%8F%87%E9%B8%A1%E6%B1%A4',
        selected: false
      },
      {
        id: 6,
        name: '银耳雪梨羹',
        category: '甜品',
        categoryType: 'dessert',
        difficulty: '简单',
        cookingTime: '35分钟',
        servings: 3,
        calories: 180,
        image: 'https://via.placeholder.com/300x200/163127/fffaf4?text=%E9%93%B6%E8%80%B3%E9%9B%AA%E6%A2%A8%E7%BE%B9',
        selected: false
      }
    ]
  },

  loadSelectedDishes() {
    this.setData({
      selectedCount: app.getSelectedDishes().length
    })
  },

  updateSelectedStatus() {
    const selectedIds = new Set(app.getSelectedDishes().map((dish) => dish.id))

    this.setData({
      allDishes: this.data.allDishes.map((dish) => ({
        ...dish,
        selected: selectedIds.has(dish.id)
      }))
    })

    this.filterDishes()
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    const current = this.data.categories.find((item) => item.id === category)

    this.setData({
      currentCategory: category,
      categoryName: current ? current.name : '全部'
    })

    this.filterDishes()
  },

  filterDishes() {
    const { currentCategory, allDishes } = this.data

    this.setData({
      filteredDishes: currentCategory === 'all'
        ? allDishes
        : allDishes.filter((dish) => dish.categoryType === currentCategory)
    })
  },

  goToDetail(e) {
    wx.navigateTo({
      url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}`
    })
  },

  toggleSelect(e) {
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
    this.updateSelectedStatus()
  },

  goToMenu() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
