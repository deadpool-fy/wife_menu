const cloudApiService = require('../../utils/cloudApi.js')

Page({
  data: {
    recipes: [],
    categories: [],
    stats: {
      totalRecipes: 0,
      totalCategories: 0,
      recentRecipes: []
    },
    filterCategoryIndex: -1,
    filterDifficultyIndex: -1,
    searchKeyword: '',
    difficulties: ['简单', '中等', '困难'],
    currentPage: 1,
    totalPages: 1,
    hasMore: true,
    isLoading: false
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    try {
      this.setData({ isLoading: true })
      await Promise.all([
        this.loadCategories(),
        this.loadStats(),
        this.loadRecipes(1, false)
      ])
    } catch (error) {
      console.error('加载数据失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  getQueryParams(page = 1) {
    const params = {
      page,
      limit: 20,
      isActive: true
    }

    if (this.data.filterCategoryIndex >= 0 && this.data.categories[this.data.filterCategoryIndex]) {
      params.category = this.data.categories[this.data.filterCategoryIndex].value
    }

    if (this.data.filterDifficultyIndex >= 0) {
      params.difficulty = this.data.difficulties[this.data.filterDifficultyIndex]
    }

    if (this.data.searchKeyword.trim()) {
      params.search = this.data.searchKeyword.trim()
    }

    return params
  },

  async loadRecipes(page = 1, append = false) {
    const result = await cloudApiService.getRecipes(this.getQueryParams(page))

    if (!result.success) {
      throw new Error(result.message || '加载菜谱失败')
    }

    const incoming = result.data.recipes || []
    const recipes = append ? [...this.data.recipes, ...incoming] : incoming
    const total = result.data.total || recipes.length

    this.setData({
      recipes,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / 20)),
      hasMore: recipes.length < total
    })
  },

  async loadCategories() {
    const result = await cloudApiService.getCategories()
    if (result.success) {
      this.setData({
        categories: result.data
      })
    }
  },

  async loadStats() {
    const result = await cloudApiService.getStats()
    if (result.success) {
      this.setData({
        stats: result.data
      })
    }
  },

  async refreshData() {
    wx.showLoading({ title: '刷新中...' })
    try {
      await this.loadData()
      wx.showToast({
        title: '已刷新',
        icon: 'success'
      })
    } catch (error) {
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  addRecipe() {
    wx.navigateTo({
      url: '/pages/recipe-add/recipe-add'
    })
  },

  previewRecipe(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  editRecipe(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/recipe-add/recipe-add?id=' + id
    })
  },

  deleteRecipe(e) {
    const id = e.currentTarget.dataset.id
    const recipe = this.data.recipes.find((item) => item._id === id)

    wx.showModal({
      title: '删除菜谱',
      content: `确认删除“${recipe ? recipe.title : '该菜谱'}”吗？此操作不可恢复。`,
      confirmColor: '#bf5638',
      success: async (res) => {
        if (!res.confirm) {
          return
        }

        await this.performDelete(id)
      }
    })
  },

  async performDelete(id) {
    try {
      wx.showLoading({ title: '删除中...' })
      const result = await cloudApiService.deleteRecipe(id)

      if (!result.success) {
        throw new Error(result.message || '删除失败')
      }

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })

      await this.loadData()
    } catch (error) {
      console.error('删除菜谱失败:', error)
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  onCategoryFilterChange(e) {
    this.setData({
      filterCategoryIndex: Number(e.detail.value)
    })
    this.loadRecipes(1, false)
  },

  onDifficultyFilterChange(e) {
    this.setData({
      filterDifficultyIndex: Number(e.detail.value)
    })
    this.loadRecipes(1, false)
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  onSearch() {
    this.loadRecipes(1, false)
  },

  async loadMore() {
    if (this.data.isLoading || !this.data.hasMore) {
      return
    }

    try {
      this.setData({ isLoading: true })
      await this.loadRecipes(this.data.currentPage + 1, true)
    } catch (error) {
      console.error('加载更多失败:', error)
      wx.showToast({
        title: '加载更多失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  }
})
