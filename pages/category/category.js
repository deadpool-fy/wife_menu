const app = getApp()
const cloudApiService = require('../../utils/cloudApi.js')
const { decorateRecipeImage } = require('../../utils/recipeImage.js')

const CATEGORY_ALIASES = {
  all: ['全部', 'all'],
  meat: ['荤菜', '肉菜', 'meat'],
  vegetable: ['素菜', '凉菜', 'vegetable'],
  mixed: ['搭配', '荤素搭配', '家常菜', '主食', 'mixed'],
  soup: ['汤品', '汤类', 'soup'],
  dessert: ['甜品', '饮品', 'dessert']
}

const DEFAULT_CATEGORIES = [
  { id: 'all', name: '全部', icon: '全' },
  { id: 'meat', name: '荤菜', icon: '肉' },
  { id: 'vegetable', name: '素菜', icon: '素' },
  { id: 'mixed', name: '搭配', icon: '拼' },
  { id: 'soup', name: '汤品', icon: '汤' },
  { id: 'dessert', name: '甜品', icon: '甜' }
]

const DEFAULT_SCENES = [
  { id: 'all', label: '全部灵感' },
  { id: 'quick', label: '下班快手' },
  { id: 'light', label: '轻负担' },
  { id: 'duo', label: '两人餐' }
]

function buildCategoriesWithCounts(allDishes = []) {
  return DEFAULT_CATEGORIES.map((category) => ({
    ...category,
    count: category.id === 'all'
      ? allDishes.length
      : allDishes.filter((dish) => dish.categoryType === category.id).length
  }))
}

function parseCookingMinutes(text) {
  const value = String(text || '').trim()
  if (!value) return null

  const hourMatch = value.match(/(\d+(?:\.\d+)?)\s*小时/)
  if (hourMatch) return Math.round(Number(hourMatch[1]) * 60)

  const minuteMatch = value.match(/(\d+(?:\.\d+)?)\s*分钟/)
  if (minuteMatch) return Math.round(Number(minuteMatch[1]))

  return null
}

function parseCalories(value) {
  const matched = String(value || '').match(/(\d+(?:\.\d+)?)/)
  return matched ? Number(matched[1]) : null
}

function normalizeCategoryName(rawCategory) {
  const value = String(rawCategory || '').trim()
  if (!value) return '搭配'

  const matched = Object.entries(CATEGORY_ALIASES).find(([, aliases]) => aliases.includes(value))
  if (!matched) return value

  const [id] = matched
  const item = DEFAULT_CATEGORIES.find((category) => category.id === id)
  return item ? item.name : value
}

function getCategoryType(rawCategory) {
  const value = String(rawCategory || '').trim()
  const matched = Object.entries(CATEGORY_ALIASES).find(([, aliases]) => aliases.includes(value))
  return matched ? matched[0] : 'mixed'
}

function matchSceneMode(dish, mode) {
  const minutes = parseCookingMinutes(dish.cookingTime)
  const calories = parseCalories(dish.calories)
  const servings = Number(dish.servings || 0)

  if (mode === 'quick') {
    return (minutes !== null && minutes <= 20) || (dish.difficulty === '简单' && minutes !== null && minutes <= 30)
  }

  if (mode === 'light') {
    return calories !== null && calories <= 400
  }

  if (mode === 'duo') {
    return servings > 0 && servings <= 2
  }

  return true
}

function buildDish(recipe) {
  const category = normalizeCategoryName(recipe.category)

  return decorateRecipeImage({
    id: recipe._id,
    name: recipe.title,
    category,
    categoryType: getCategoryType(category),
    difficulty: recipe.difficulty || '简单',
    cookingTime: recipe.cookingTime || '30分钟',
    servings: recipe.servings || 2,
    calories: recipe.calories || '--',
    rating: recipe.rating || 0,
    likeCount: recipe.likeCount || 0,
    image: recipe.image || '',
    importSource: recipe.importSource || '',
    selected: false
  })
}

Page({
  data: {
    currentCategory: 'all',
    currentSceneMode: 'all',
    categoryName: '全部',
    allDishes: [],
    filteredDishes: [],
    selectedCount: 0,
    loading: false,
    error: null,
    categories: DEFAULT_CATEGORIES,
    sceneModes: DEFAULT_SCENES
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
        limit: 200
      })

      if (!response.success) {
        throw new Error(response.message || '获取菜谱数据失败')
      }

      const allDishes = (response.data.recipes || []).map(buildDish)

      this.setData({
        allDishes,
        filteredDishes: allDishes,
        categories: buildCategoriesWithCounts(allDishes),
        loading: false
      })

      this.updateSelectedStatus()
    } catch (error) {
      console.error('加载菜谱数据失败:', error)
      this.setData({
        allDishes: [],
        filteredDishes: [],
        categories: buildCategoriesWithCounts([]),
        loading: false,
        error: '菜谱数据暂时加载失败，请稍后重试'
      })
    }
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

  switchSceneMode(e) {
    this.setData({
      currentSceneMode: e.currentTarget.dataset.mode || 'all'
    })
    this.filterDishes()
  },

  filterDishes() {
    const { currentCategory, currentSceneMode, allDishes } = this.data
    const categoryFiltered = currentCategory === 'all'
      ? allDishes
      : allDishes.filter((dish) => dish.categoryType === currentCategory)

    this.setData({
      filteredDishes: categoryFiltered.filter((dish) => matchSceneMode(dish, currentSceneMode))
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
      wx.showToast({ title: '已移出菜单', icon: 'success' })
    } else {
      app.addSelectedDish(dish)
      wx.showToast({ title: '已加入菜单', icon: 'success' })
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
