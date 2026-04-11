const app = getApp()
const messageService = require('../../utils/messageService.js')
const cloudApiService = require('../../utils/cloudApi.js')

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
    ? '天气清亮，很适合安排一顿明快、热气腾腾的晚餐。'
    : '夜色安静，适合把今晚的菜单安排得更有一点仪式感。'

  if ([1, 2, 3].includes(code)) {
    themeClass = 'cloudy'
    label = code === 1 ? '少云' : '多云'
    summary = '云层比较柔和，适合来点热菜和汤，把整顿饭做得更有安定感。'
  } else if ([45, 48].includes(code)) {
    themeClass = 'foggy'
    label = '雾气'
    summary = '空气偏湿润，适合安排更暖一点、更有香气的菜。'
  } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code) || precipitation > 0.2) {
    themeClass = 'rainy'
    label = '下雨'
    summary = '今天偏雨意，适合做一桌热乎、下饭、带点汤汁的内容。'
  } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
    themeClass = 'snowy'
    label = '下雪'
    summary = '天气偏冷，适合安排更厚实、更有暖意的炖菜和汤品。'
  } else if ([95, 96, 99].includes(code)) {
    themeClass = 'stormy'
    label = '雷雨'
    summary = '天气不太稳定，今晚更适合选几道稳妥、治愈感强的家常菜。'
  } else if (!isDay) {
    themeClass = 'night'
    label = '夜晚'
    summary = '夜色安静，适合把今晚的菜单安排得更有一点仪式感。'
  }

  const temperatureText = hasTemperature ? (temperature + '\u00b0C') : '--'
  const rawApparent = Number(snapshot.apparentTemperature)
  const apparent = Number.isFinite(rawApparent) ? Math.round(rawApparent) : (hasTemperature ? temperature : null)
  const detail = apparent === null
    ? '\u5b9e\u65f6\u6e29\u5ea6\u6682\u672a\u83b7\u53d6\u5230\uff0c\u5148\u6309\u5f53\u524d\u65f6\u6bb5\u4e3a\u4f60\u5c55\u793a\u5929\u6c14\u6c1b\u56f4\u3002'
    : windSpeed > 0
      ? ('\u4f53\u611f ' + apparent + '\u00b0C \u00b7 \u98ce\u901f ' + windSpeed + ' km/h')
      : ('\u4f53\u611f ' + apparent + '\u00b0C')

  return {
    themeClass,
    label,
    temperatureText,
    detail,
    summary,
    locationText: snapshot.locationText || '当前位置'
  }
}

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
    sharePath: '/pages/index/index',
    weatherLoaded: false,
    weatherLabel: '天气感知中',
    weatherTemperature: '--',
    weatherDetail: '正在判断今天更适合怎样的一顿饭',
    weatherSummary: '系统会根据当天状态调整首页气氛，让这顿饭更有当下感。',
    weatherLocationText: '当前位置',
    weatherThemeClass: 'sunny'
  },

  onLoad() {
    this.setCurrentDate()
    this.loadSelectedDishes()
    this.loadRecommendDishes()
    this.loadWeatherHero()
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
      currentDate: now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 星期' + weekdays[now.getDay()]
    })
  },

  async loadWeatherHero() {
    const fallbackTheme = buildWeatherTheme({}, new Date().getHours())
    this.applyWeatherTheme(fallbackTheme)

    try {
      const location = await this.requestLocation()
      console.log('[weather] location', location)
      const result = await cloudApiService.getWeatherSnapshot({
        latitude: location.latitude,
        longitude: location.longitude
      })

      console.log('[weather] cloud result', result)

      if (!(result.success && result.data)) {
        throw new Error(result.message || '天气获取失败')
      }

      this.applyWeatherTheme(buildWeatherTheme({
        ...result.data,
        locationText: '当前位置'
      }))
    } catch (error) {
      console.error('加载天气背景失败:', error)
      const errMsg = String((error && error.errMsg) || (error && error.message) || '')
      const detail = errMsg.includes('requiredPrivateInfos')
        ? '定位能力尚未声明完成，请重新编译后再试；当前先按时段为你展示天气氛围。'
        : errMsg.includes('auth deny') || errMsg.includes('authorize')
          ? '你还没有允许定位权限，当前先按时段为你展示天气氛围。'
          : '未获取到实时天气，先按当前时段为你营造氛围。'

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
    console.log('[weather] applied theme', theme)
    this.setData({
      weatherLoaded: true,
      weatherLabel: theme.label,
      weatherTemperature: theme.temperatureText || '--',
      weatherDetail: theme.detail,
      weatherSummary: theme.summary,
      weatherLocationText: theme.locationText,
      weatherThemeClass: theme.themeClass,
      heroTip: theme.summary,
      todayMood: theme.label + ' · ' + theme.temperatureText
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
        throw new Error(response.message || '????????')
      }

      const recommendDishes = response.data.map((recipe, index) => ({
        id: recipe._id,
        name: recipe.title,
        image: recipe.image || '/images/default-dish.png',
        category: recipe.category || '???',
        difficulty: recipe.difficulty || '??',
        cookingTime: recipe.cookingTime || '30??',
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
      console.error('????????:', error)

      if (String(error.message || '').includes('collection') || String(error.message || '').includes('not found')) {
        await this.initDatabase()
        return
      }

      const { getRecommendDishes } = require('../../data/dishes.js')
      const fallbackDishes = getRecommendDishes().map((dish, index) => ({
        ...dish,
        difficulty: dish.difficulty || '??',
        cookingTime: dish.cookingTime || '30??',
        servings: dish.servings || 2,
        rating: dish.rating || 0,
        likeCount: dish.likeCount || 0,
        isNew: index < 2
      }))

      this.setData({
        recommendDishes: fallbackDishes,
        loading: false,
        error: '???????????????'
      })

      wx.showToast({
        title: '????????',
        icon: 'none',
        duration: 1800
      })
    }
  },

  async initDatabase() {
    try {
      wx.showLoading({ title: '???????...' })

      const result = await wx.cloud.callFunction({
        name: 'init-database'
      })

      wx.hideLoading()

      if (!result.result.success) {
        throw new Error(result.result.message || '?????')
      }

      wx.showToast({
        title: '???????',
        icon: 'success'
      })

      await this.loadRecommendDishes()
    } catch (error) {
      wx.hideLoading()
      console.error('????????:', error)

      wx.showModal({
        title: '?????',
        content: '??????????????',
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
      url: '/pages/detail/detail?id=' + id
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
    this.loadWeatherHero()
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
      })
      .catch((error) => {
        wx.hideLoading()
        wx.showToast({
          title: error.message || '发送失败',
          icon: 'none'
        })
      })
  },

  copyMenuToClipboard(selectedDishes) {
    let content = '今晚菜单：\n\n'
    selectedDishes.forEach((dish, index) => {
      content += (index + 1) + '. ' + dish.name + '\n'
      content += '  ' + (dish.category || '家常菜') + ' · ' + (dish.cookingTime || '30分钟') + ' · ' + (dish.servings || 2) + ' 人\n\n'
    })

    messageService.copyToClipboard(content)
      .catch((error) => {
        wx.showToast({
          title: error.message || '复制失败',
          icon: 'none'
        })
      })
  },

  shareMenuToFriend(selectedDishes) {
    const summary = selectedDishes.map((dish) => dish.name).join('、')
    this.setData({
      sharePanelVisible: true,
      shareTitle: '今晚菜单已经搭好了',
      shareSummary: summary,
      sharePath: '/pages/index/index'
    })
  },

  closeSharePanel() {
    this.setData({ sharePanelVisible: false })
  },

  goToAdmin() {
    wx.navigateTo({
      url: '/pages/admin/admin'
    })
  },

  onShareAppMessage() {
    return {
      title: this.data.shareTitle || '今晚菜单已经搭好了',
      path: this.data.sharePath || '/pages/index/index'
    }
  }
})
