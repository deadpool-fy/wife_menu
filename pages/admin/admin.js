const cloudApiService = require('../../utils/cloudApi.js')

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

  onLoad() {
    this.loadStats()
    this.loadLogs()
  },

  onShow() {
    this.loadStats()
  },

  async loadStats() {
    try {
      const response = await cloudApiService.getStats()

      if (!response.success) {
        throw new Error(response.message || '统计数据获取失败')
      }

      this.setData({
        stats: {
          totalRecipes: response.data.totalRecipes || 0,
          featuredRecipes: response.data.featuredRecipes || response.data.recentRecipes?.length || 0,
          totalCategories: response.data.totalCategories || response.data.categories || 0,
          pendingImports: response.data.pendingImports || 0
        }
      })

      this.addLog('统计信息已更新', 'success')
    } catch (error) {
      console.error('加载统计信息失败:', error)
      this.addLog('统计信息加载失败，稍后可重试', 'error')
    }
  },

  loadLogs() {
    const now = new Date().toLocaleTimeString()
    this.setData({
      logs: [
        {
          time: now,
          message: '后台工作台已就绪',
          type: 'success'
        },
        {
          time: now,
          message: '可以继续管理菜谱、初始化数据或执行清理操作',
          type: 'info'
        }
      ]
    })
  },

  goToRecipeManage() {
    this.addLog('进入菜谱管理页', 'info')
    wx.navigateTo({
      url: '/pages/recipe-manage/recipe-manage'
    })
  },

  goToRecipeAdd() {
    this.addLog('进入新增菜谱页', 'info')
    wx.navigateTo({
      url: '/pages/recipe-add/recipe-add'
    })
  },

  goToRecipeImport() {
    this.addLog('进入导入助手页', 'info')
    wx.navigateTo({
      url: '/pages/recipe-import/recipe-import'
    })
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
      wx.showToast({
        title: '连接正常',
        icon: 'success'
      })
    } catch (error) {
      wx.hideLoading()
      this.addLog(`云端连接失败：${error.message}`, 'error')
      wx.showToast({
        title: '连接失败',
        icon: 'none'
      })
    }
  },

  initData() {
    wx.showModal({
      title: '初始化数据',
      content: '会写入一批基础示例数据，方便继续调试和演示，是否继续？',
      success: async (res) => {
        if (!res.confirm) {
          return
        }

        await this.performInitData()
      }
    })
  },

  async performInitData() {
    try {
      wx.showLoading({ title: '初始化中...' })
      const result = await wx.cloud.callFunction({
        name: 'init-database'
      })
      wx.hideLoading()

      if (!result.result.success) {
        throw new Error(result.result.message || '初始化失败')
      }

      this.addLog('基础数据初始化完成', 'success')
      wx.showToast({
        title: '初始化完成',
        icon: 'success'
      })
      this.loadStats()
    } catch (error) {
      wx.hideLoading()
      this.addLog(`初始化失败：${error.message}`, 'error')
      wx.showToast({
        title: '初始化失败',
        icon: 'none'
      })
    }
  },

  clearData() {
    this.confirmDangerAction(
      '清空全部数据',
      '会删除菜谱、分类、收藏和评分数据，此操作不可恢复，确认继续吗？',
      this.performClearData.bind(this)
    )
  },

  clearRecipes() {
    this.confirmDangerAction(
      '清空菜谱',
      '会删除全部菜谱数据，但保留分类和其它信息，确认继续吗？',
      this.performClearRecipes.bind(this)
    )
  },

  clearCategories() {
    this.confirmDangerAction(
      '清空分类',
      '会删除全部分类数据，确认继续吗？',
      this.performClearCategories.bind(this)
    )
  },

  confirmDangerAction(title, content, action) {
    wx.showModal({
      title,
      content,
      confirmColor: '#bf5638',
      success: async (res) => {
        if (!res.confirm) {
          return
        }

        await action()
      }
    })
  },

  async performClearData() {
    await this.clearCollections([
      'recipes',
      'categories',
      'user_favorites',
      'user_ratings'
    ], '已清空全部数据')
  },

  async performClearRecipes() {
    await this.clearCollections(['recipes'], '已清空全部菜谱')
  },

  async performClearCategories() {
    await this.clearCollections(['categories'], '已清空全部分类')
  },

  async clearCollections(collections, successMessage) {
    try {
      wx.showLoading({ title: '处理中...' })
      const db = wx.cloud.database()
      let totalCleared = 0

      for (const collectionName of collections) {
        const result = await db.collection(collectionName).get()
        for (const item of result.data) {
          await db.collection(collectionName).doc(item._id).remove()
          totalCleared += 1
        }
      }

      wx.hideLoading()
      this.addLog(`${successMessage}，共删除 ${totalCleared} 条记录`, 'success')
      wx.showToast({
        title: '处理完成',
        icon: 'success'
      })
      this.loadStats()
    } catch (error) {
      wx.hideLoading()
      this.addLog(`清理失败：${error.message}`, 'error')
      wx.showToast({
        title: '处理失败',
        icon: 'none'
      })
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
