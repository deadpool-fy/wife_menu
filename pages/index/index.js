const app = getApp()
const cloudApiService = require('../../utils/cloudApi.js')
const { decorateRecipeImage } = require('../../utils/recipeImage.js')

const RECOMMEND_MODES = [
  { id: 'all', label: '全部' },
  { id: 'quick', label: '下班快手' },
  { id: 'light', label: '轻负担' },
  { id: 'duo', label: '两人餐' }
]

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

function matchRecommendMode(dish, mode) {
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

function buildSharedMenuPath(dishes = [], currentDate = '') {
  const payload = {
    type: 'menu',
    title: '今晚菜单',
    subtitle: currentDate || '',
    items: dishes.slice(0, 8).map((dish) => ({
      name: dish.name,
      category: dish.category,
      cookingTime: dish.cookingTime,
      servings: dish.servings,
      calories: dish.calories
    }))
  }

  return '/pages/share-menu/share-menu?payload=' + encodeURIComponent(JSON.stringify(payload))
}

function buildWeatherTheme(snapshot = {}, fallbackHour = new Date().getHours()) {
  const code = Number(snapshot.weatherCode || 0)
  const isDay = typeof snapshot.isDay === 'boolean' ? snapshot.isDay : (fallbackHour >= 6 && fallbackHour < 18)
  const rawTemperature = Number(snapshot.temperature)
  const hasTemperature = Number.isFinite(rawTemperature)
  const temperature = hasTemperature ? Math.round(rawTemperature) : null
  const precipitation = Number(snapshot.precipitation || 0)
  const windSpeed = Math.round(Number(snapshot.windSpeed || 0))

  let themeClass = isDay ? 'sunny' : 'night'
  let label = isDay ? '晴朗' : '夜晚'
  let summary = isDay
    ? '天气明亮，适合做一顿热气腾腾、看着就有食欲的晚餐。'
    : '夜色安静，适合把今晚这顿饭安排得更有一点仪式感。'

  if ([1, 2, 3].includes(code)) {
    themeClass = 'cloudy'
    label = code === 1 ? '少云' : '多云'
    summary = '云层比较柔和，适合来点热菜和暖汤，让晚餐更有安定感。'
  } else if ([45, 48].includes(code)) {
    themeClass = 'foggy'
    label = '雾气'
    summary = '空气偏湿润，适合安排更暖一点、香气更足的菜。'
  } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code) || precipitation > 0.2) {
    themeClass = 'rainy'
    label = '下雨'
    summary = '今天有点雨意，适合做一桌热乎、下饭、带点汤汁的内容。'
  } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
    themeClass = 'snowy'
    label = '下雪'
    summary = '天气偏冷，适合安排更厚实、更暖胃的炖菜和汤品。'
  } else if ([95, 96, 99].includes(code)) {
    themeClass = 'stormy'
    label = '雷雨'
    summary = '天气不太稳定，今晚更适合选几道稳妥、治愈感强的家常菜。'
  } else if (!isDay) {
    themeClass = 'night'
    label = '夜晚'
    summary = '夜色安静，适合把今晚这顿饭安排得更有一点仪式感。'
  }

  const temperatureText = hasTemperature ? `${temperature}°C` : '--'
  const rawApparent = Number(snapshot.apparentTemperature)
  const apparent = Number.isFinite(rawApparent) ? Math.round(rawApparent) : (hasTemperature ? temperature : null)
  const detail = apparent === null
    ? '实时温度暂未获取到，先按当前时段为你展示天气氛围。'
    : windSpeed > 0
      ? `体感 ${apparent}°C · 风速 ${windSpeed} km/h`
      : `体感 ${apparent}°C`

  return {
    themeClass,
    label,
    temperatureText,
    detail,
    summary,
    locationText: snapshot.locationText || '当前位置'
  }
}

function buildRecommendDish(recipe, index) {
  return decorateRecipeImage({
    id: recipe._id,
    name: recipe.title,
    image: recipe.image || '',
    category: recipe.category || '家常菜',
    difficulty: recipe.difficulty || '简单',
    cookingTime: recipe.cookingTime || '30分钟',
    calories: recipe.calories || '--',
    servings: recipe.servings || 2,
    rating: recipe.rating || 0,
    likeCount: recipe.likeCount || 0,
    selected: false,
    isNew: index < 2
  })
}

Page({
  data: {
    currentDate: '',
    selectedDishes: [],
    allRecommendDishes: [],
    recommendDishes: [],
    loading: false,
    error: null,
    todayMood: '适合安排一顿认真做的晚餐',
    heroTip: '先从推荐里挑几道顺眼的菜，再慢慢拼出今晚这顿饭的节奏。',
    adminEntryVisible: false,
    recommendMode: 'all',
    recommendModes: RECOMMEND_MODES,
    recommendPage: 0,
    recommendPageSize: 4,
    sharePanelVisible: false,
    shareTitle: '',
    shareSummary: '',
    sharePath: '/pages/index/index',
    weatherLoaded: false,
    weatherLabel: '天气感知中',
    weatherTemperature: '--',
    weatherDetail: '正在判断今天更适合怎样的一顿饭',
    weatherSummary: '系统会根据当天状态调整首页氛围，让晚餐看起来更有当下感。',
    weatherLocationText: '当前位置',
    weatherThemeClass: 'sunny'
  },

  onLoad() {
    this.setCurrentDate()
    this.loadSelectedDishes()
    this.loadRecommendDishes()
    this.loadWeatherHero()
    this.refreshAdminEntry()
  },

  onShow() {
    this.loadSelectedDishes()
    this.updateRecommendDishes()
    this.syncTabBar()
    this.refreshAdminEntry()
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

  async refreshAdminEntry() {
    const result = await app.ensureAdminStatus(true)
    this.setData({
      adminEntryVisible: !!result.isAdmin
    })
  },

  async loadWeatherHero() {
    const fallbackTheme = buildWeatherTheme({}, new Date().getHours())
    this.applyWeatherTheme(fallbackTheme)

    try {
      const location = await this.requestLocation()
      const result = await cloudApiService.getWeatherSnapshot({
        latitude: location.latitude,
        longitude: location.longitude
      })

      if (!(result.success && result.data)) {
        throw new Error(result.message || '天气获取失败')
      }

      this.applyWeatherTheme(buildWeatherTheme({
        ...result.data,
        locationText: '当前位置'
      }))
    } catch (error) {
      const errMsg = String((error && error.errMsg) || (error && error.message) || '')
      const detail = errMsg.includes('requiredPrivateInfos')
        ? '定位声明还没有生效，请重新编译后再试，当前先按时段展示天气氛围。'
        : errMsg.includes('auth deny') || errMsg.includes('authorize')
          ? '你还没有允许定位权限，当前先按时段展示天气氛围。'
          : '未获取到实时天气，当前先按时段展示天气氛围。'

      this.applyWeatherTheme({
        ...fallbackTheme,
        detail
      })
    }
  },

  requestLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: resolve,
        fail: reject
      })
    })
  },

  applyWeatherTheme(theme) {
    this.setData({
      weatherLoaded: true,
      weatherLabel: theme.label,
      weatherTemperature: theme.temperatureText || '--',
      weatherDetail: theme.detail,
      weatherSummary: theme.summary,
      weatherLocationText: theme.locationText,
      weatherThemeClass: theme.themeClass,
      heroTip: theme.summary,
      todayMood: `${theme.label} · ${theme.temperatureText}`
    })
  },

  loadSelectedDishes() {
    this.setData({
      selectedDishes: app.getSelectedDishes().map((dish) => decorateRecipeImage(dish))
    })
  },

  async loadRecommendDishes() {
    this.setData({ loading: true, error: null })

    try {
      const response = await cloudApiService.getRecommendRecipes(20)
      if (!response.success) {
        throw new Error(response.message || '获取推荐菜谱失败')
      }

      const recommendDishes = (response.data || []).map(buildRecommendDish)
      this.setData({
        allRecommendDishes: recommendDishes,
        recommendPage: 0,
        loading: false,
        error: recommendDishes.length ? null : '当前还没有菜谱数据，可以先去后台导入预设菜谱。'
      })

      this.updateRecommendDishes()
    } catch (error) {
      this.setData({
        allRecommendDishes: [],
        recommendDishes: [],
        recommendPage: 0,
        loading: false,
        error: '菜谱数据暂时加载失败，请稍后重试'
      })

      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 1800
      })
    }
  },

  updateRecommendDishes() {
    const selectedIds = new Set(this.data.selectedDishes.map((dish) => dish.id))
    const allRecommendDishes = this.data.allRecommendDishes.map((dish) => ({
      ...dish,
      selected: selectedIds.has(dish.id)
    }))

    this.setData({ allRecommendDishes })
    this.applyRecommendMode()
  },

  switchRecommendMode(e) {
    this.setData({
      recommendMode: e.currentTarget.dataset.mode || 'all',
      recommendPage: 0
    })
    this.applyRecommendMode()
  },

  applyRecommendMode() {
    const filtered = this.data.allRecommendDishes.filter((dish) => matchRecommendMode(dish, this.data.recommendMode))
    const pageSize = Math.max(1, Number(this.data.recommendPageSize) || 4)
    const totalPages = filtered.length ? Math.ceil(filtered.length / pageSize) : 0
    const page = totalPages ? Math.min(this.data.recommendPage, totalPages - 1) : 0
    const start = page * pageSize

    this.setData({
      recommendDishes: filtered.slice(start, start + pageSize),
      recommendPage: page
    })
  },

  refreshRecommend() {
    const filtered = this.data.allRecommendDishes.filter((dish) => matchRecommendMode(dish, this.data.recommendMode))
    const pageSize = Math.max(1, Number(this.data.recommendPageSize) || 4)
    const totalPages = filtered.length ? Math.ceil(filtered.length / pageSize) : 0

    if (!totalPages) {
      wx.showToast({
        title: '当前没有可切换的推荐',
        icon: 'none'
      })
      return
    }

    const nextPage = (this.data.recommendPage + 1) % totalPages
    this.setData({ recommendPage: nextPage })
    this.applyRecommendMode()

    wx.showToast({
      title: totalPages > 1 ? `已切换到第 ${nextPage + 1} 组` : '当前这一组已经是全部推荐',
      icon: 'none'
    })
  },

  goToDetail(e) {
    wx.navigateTo({
      url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}`
    })
  },

  selectDish(e) {
    const dish = e.currentTarget.dataset.dish

    if (dish.selected) {
      app.removeSelectedDish(dish.id)
      wx.showToast({ title: '已移出菜单', icon: 'success' })
    } else {
      app.addSelectedDish(dish)
      wx.showToast({ title: '已加入菜单', icon: 'success' })
    }

    this.loadSelectedDishes()
    this.updateRecommendDishes()
  },

  removeDish(e) {
    app.removeSelectedDish(e.currentTarget.dataset.id)
    this.loadSelectedDishes()
    this.updateRecommendDishes()
  },

  clearSelected() {
    app.clearSelectedDishes()
    this.loadSelectedDishes()
    this.updateRecommendDishes()
    wx.showToast({ title: '已清空菜单', icon: 'success' })
  },

  goToAdmin() {
    if (!this.data.adminEntryVisible) return
    wx.navigateTo({ url: '/pages/admin/admin' })
  },

  sendToWeChat() {
    const selectedDishes = this.data.selectedDishes || []
    if (!selectedDishes.length) {
      wx.showToast({
        title: '先选几道菜再分享',
        icon: 'none'
      })
      return
    }

    const shareSummary = selectedDishes
      .slice(0, 4)
      .map((dish) => dish.name)
      .join('、')

    this.setData({
      sharePanelVisible: true,
      shareTitle: '今晚菜单',
      shareSummary,
      sharePath: buildSharedMenuPath(selectedDishes, this.data.currentDate)
    })
  },

  closeSharePanel() {
    this.setData({
      sharePanelVisible: false
    })
  },

  onShareAppMessage() {
    if (this.data.sharePanelVisible && this.data.sharePath) {
      return {
        title: this.data.shareTitle || '今晚菜单',
        path: this.data.sharePath
      }
    }

    return {
      title: '晚餐手记',
      path: '/pages/index/index'
    }
  }
})
