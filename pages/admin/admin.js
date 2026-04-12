const cloudApiService = require('../../utils/cloudApi.js')
const app = getApp()

Page({
  data: {
    logs: [],
    stats: {
      totalRecipes: 0,
      featuredRecipes: 0,
      totalCategories: 0,
      pendingImports: 0
    }
  },

  async onLoad() {
    const allowed = await this.ensureAdminAccess()
    if (!allowed) return
    await this.loadStats()
    this.loadLogs()
  },

  async onShow() {
    const allowed = await this.ensureAdminAccess()
    if (!allowed) return
    await this.loadStats()
  },

  async ensureAdminAccess() {
    const result = await app.ensureAdminStatus(true)
    if (result.isAdmin) return true

    wx.showModal({
      title: '无后台权限',
      content: '当前账号不在管理员白名单中，无法进入后台工作台。',
      showCancel: false,
      success: () => {
        wx.switchTab({ url: '/pages/index/index' })
      }
    })

    return false
  },

  async loadStats() {
    try {
      const response = await cloudApiService.getStats()
      if (!response.success) {
        throw new Error(response.message || '统计数据获取失败')
      }

      this.setData({
        stats: {
          totalRecipes: Number(response.data.totalRecipes || 0),
          featuredRecipes: Number(response.data.featuredRecipes || response.data.recentRecipes?.length || 0),
          totalCategories: Number(response.data.totalCategories || 0),
          pendingImports: Number(response.data.pendingImports || 0)
        }
      })

      this.addLog('统计信息已更新', 'success')
    } catch (error) {
      console.error('加载统计信息失败:', error)
      this.addLog('统计信息加载失败，请稍后重试', 'error')
    }
  },

  loadLogs() {
    const now = new Date().toLocaleTimeString()
    this.setData({
      logs: [
        { time: now, message: '后台工作台已就绪', type: 'success' },
        { time: now, message: '可以继续管理菜谱、导入数据和执行清理操作', type: 'info' }
      ]
    })
  },

  goToRecipeManage() {
    this.addLog('进入菜谱管理页', 'info')
    wx.navigateTo({ url: '/pages/recipe-manage/recipe-manage' })
  },

  goToRecipeAdd() {
    this.addLog('进入新增菜谱页', 'info')
    wx.navigateTo({ url: '/pages/recipe-add/recipe-add' })
  },

  goToRecipeImport() {
    this.addLog('进入导入助手页', 'info')
    wx.navigateTo({ url: '/pages/recipe-import/recipe-import' })
  },

  async testConnection() {
    this.addLog('正在测试云端连接...', 'info')
    wx.showLoading({ title: '检测中...' })

    try {
      const response = await cloudApiService.getStats()
      wx.hideLoading()

      if (!response.success) {
        throw new Error(response.message || '连接失败')
      }

      this.addLog('云端连接正常', 'success')
      wx.showToast({ title: '连接正常', icon: 'success' })
    } catch (error) {
      wx.hideLoading()
      this.addLog(`云端连接失败：${error.message}`, 'error')
      wx.showToast({ title: '连接失败', icon: 'none' })
    }
  },

  initData() {
    wx.showModal({
      title: '初始化数据',
      content: '会写入一批基础示例数据，方便继续调试和演示，是否继续？',
      success: async (res) => {
        if (!res.confirm) return
        await this.performInitData()
      }
    })
  },

  seedPresetRecipes() {
    wx.showModal({
      title: '导入预设菜谱',
      content: '会一次性导入 100 条预设菜谱，并自动跳过同名重复数据，是否继续？',
      success: async (res) => {
        if (!res.confirm) return
        await this.performSeedPresetRecipes()
      }
    })
  },

  repairPresetRecipeImages() {
    wx.showModal({
      title: '修复菜谱封面',
      content: '会为缺失封面和旧默认图重新生成可用封面，是否继续？',
      success: async (res) => {
        if (!res.confirm) return
        await this.performRepairPresetRecipeImages()
      }
    })
  },

  enrichRecipeImages() {
    wx.showModal({
      title: '补全真实菜图',
      content: '会为当前一批菜谱补上更接近实物的菜图，是否继续？',
      success: async (res) => {
        if (!res.confirm) return
        await this.performEnrichRecipeImages()
      }
    })
  },

  async performSeedPresetRecipes() {
    try {
      wx.showLoading({ title: '导入中...' })
      const result = await cloudApiService.seedPresetRecipes({ limit: 100 })
      wx.hideLoading()

      if (!result.success) {
        throw new Error(result.message || '导入失败')
      }

      const inserted = Number(result.data?.inserted || 0)
      const skipped = Number(result.data?.skipped || 0)
      this.addLog(`预设菜谱导入完成：新增 ${inserted} 条，跳过 ${skipped} 条`, 'success')
      wx.showToast({
        title: inserted > 0 ? `新增 ${inserted} 条` : '没有重复导入',
        icon: inserted > 0 ? 'success' : 'none'
      })
      await this.loadStats()
    } catch (error) {
      wx.hideLoading()
      const rawMessage = String(error && error.message ? error.message : error || '')
      const friendlyMessage = rawMessage.includes('未知操作')
        ? '云函数还是旧版本，请重新部署 recipe-manager 后再试'
        : (rawMessage || '导入失败')

      this.addLog(`预设菜谱导入失败：${friendlyMessage}`, 'error')
      wx.showToast({ title: friendlyMessage, icon: 'none' })
    }
  },

  async performRepairPresetRecipeImages() {
    try {
      wx.showLoading({ title: '修复中...' })
      const result = await cloudApiService.repairPresetRecipeImages({ limit: 100 })
      wx.hideLoading()

      if (!result.success) {
        throw new Error(result.message || '修复失败')
      }

      const updated = Number(result.data?.updated || 0)
      this.addLog(`菜谱封面修复完成：更新 ${updated} 条`, 'success')
      wx.showToast({
        title: updated > 0 ? `已修复 ${updated} 条` : '没有需要修复的封面',
        icon: updated > 0 ? 'success' : 'none'
      })
      await this.loadStats()
    } catch (error) {
      wx.hideLoading()
      this.addLog(`菜谱封面修复失败：${error.message}`, 'error')
      wx.showToast({ title: error.message || '修复失败', icon: 'none' })
    }
  },

  async performEnrichRecipeImages() {
    try {
      wx.showLoading({ title: '补图中...' })
      const result = await cloudApiService.enrichRecipeImages({ limit: 30 })
      wx.hideLoading()

      if (!result.success) {
        throw new Error(result.message || '补图失败')
      }

      const updated = Number(result.data?.updated || 0)
      const skipped = Number(result.data?.skipped || 0)
      this.addLog(`真实菜图补全完成：命中 ${updated} 条，跳过 ${skipped} 条`, 'success')
      wx.showToast({
        title: updated > 0 ? `补全 ${updated} 条` : '这一批暂无可补图片',
        icon: updated > 0 ? 'success' : 'none'
      })
      await this.loadStats()
    } catch (error) {
      wx.hideLoading()
      this.addLog(`真实菜图补全失败：${error.message}`, 'error')
      wx.showToast({ title: error.message || '补图失败', icon: 'none' })
    }
  },

  async performInitData() {
    try {
      wx.showLoading({ title: '初始化中...' })
      const result = await wx.cloud.callFunction({ name: 'init-database' })
      wx.hideLoading()

      if (!result.result.success) {
        throw new Error(result.result.message || '初始化失败')
      }

      this.addLog('基础数据初始化完成', 'success')
      wx.showToast({ title: '初始化完成', icon: 'success' })
      await this.loadStats()
    } catch (error) {
      wx.hideLoading()
      this.addLog(`初始化失败：${error.message}`, 'error')
      wx.showToast({ title: '初始化失败', icon: 'none' })
    }
  },

  clearData() {
    this.confirmDangerAction(
      '清空全部数据',
      '会删除 recipes、categories、recipe_imports、收藏和评分数据，此操作不可恢复，确认继续吗？',
      () => this.runRemoteClear('clearAllAppData', '已清空全部业务数据')
    )
  },

  clearRecipes() {
    this.confirmDangerAction(
      '清空菜谱',
      '会删除 recipes 集合中的全部菜谱数据，但保留分类和其他信息，确认继续吗？',
      () => this.runRemoteClear('clearRecipesData', '已清空 recipes 菜谱数据')
    )
  },

  clearCategories() {
    this.confirmDangerAction(
      '清空分类',
      '会删除 categories 集合中的全部分类数据，确认继续吗？',
      () => this.runRemoteClear('clearCategoriesData', '已清空分类数据')
    )
  },

  confirmDangerAction(title, content, action) {
    wx.showModal({
      title,
      content,
      confirmColor: '#bf5638',
      success: async (res) => {
        if (!res.confirm) return
        await action()
      }
    })
  },

  async runRemoteClear(actionName, successMessage) {
    try {
      wx.showLoading({ title: '处理中...' })
      const result = await cloudApiService[actionName]()
      wx.hideLoading()

      if (!result.success) {
        throw new Error(result.message || '清理失败')
      }

      const removed = Number(result.data?.removed || 0)
      this.addLog(`${successMessage}，共删除 ${removed} 条记录`, 'success')
      wx.showToast({ title: '处理完成', icon: 'success' })

      app.clearSelectedDishes()
      wx.removeStorageSync('selectedDishes')
      wx.removeStorageSync('userFavorites')
      wx.removeStorageSync('userRatings')
      wx.removeStorageSync('menuRatings')

      await this.loadStats()
    } catch (error) {
      wx.hideLoading()
      this.addLog(`清理失败：${error.message}`, 'error')
      wx.showToast({ title: error.message || '处理失败', icon: 'none' })
    }
  },

  refreshLogs() {
    this.addLog('日志已刷新', 'info')
  },

  addLog(message, type = 'info') {
    const logs = [{
      time: new Date().toLocaleTimeString(),
      message,
      type
    }, ...this.data.logs]

    this.setData({
      logs: logs.slice(0, 20)
    })
  }
})
