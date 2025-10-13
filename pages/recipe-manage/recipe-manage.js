// 菜谱管理页面
const cloudApiService = require('../../utils/cloudApi.js');

Page({
  data: {
    // 数据
    recipes: [],
    categories: [],
    stats: {
      totalRecipes: 0,
      totalCategories: 0,
      recentRecipes: []
    },
    
    // 筛选条件
    filterCategoryIndex: -1,
    filterDifficultyIndex: -1,
    searchKeyword: '',
    
    // 选项数据
    difficulties: ['简单', '中等', '困难'],
    
    // 分页
    currentPage: 1,
    totalPages: 1,
    hasMore: true,
    isLoading: false
  },

  onLoad() {
    console.log('菜谱管理页面加载');
    this.loadData();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadData();
  },

  // 加载数据
  async loadData() {
    try {
      this.setData({ isLoading: true });
      
      // 并行加载数据
      const [recipesResult, categoriesResult, statsResult] = await Promise.all([
        this.loadRecipes(),
        this.loadCategories(),
        this.loadStats()
      ]);
      
      console.log('数据加载完成');
    } catch (error) {
      console.error('加载数据失败:', error);
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 加载菜谱列表
  async loadRecipes() {
    try {
      const params = {
        page: 1,
        limit: 20,
        isActive: true
      };
      
      // 添加筛选条件
      if (this.data.filterCategoryIndex >= 0) {
        params.category = this.data.categories[this.data.filterCategoryIndex].value;
      }
      
      if (this.data.filterDifficultyIndex >= 0) {
        params.difficulty = this.data.difficulties[this.data.filterDifficultyIndex];
      }
      
      if (this.data.searchKeyword) {
        params.search = this.data.searchKeyword;
      }
      
      const result = await cloudApiService.getRecipes(params);
      
      if (result.success) {
        this.setData({
          recipes: result.data.recipes,
          currentPage: 1,
          totalPages: Math.ceil(result.data.total / 20),
          hasMore: result.data.recipes.length < result.data.total
        });
      }
    } catch (error) {
      console.error('加载菜谱列表失败:', error);
      throw error;
    }
  },

  // 加载分类列表
  async loadCategories() {
    try {
      const result = await cloudApiService.getCategories();
      if (result.success) {
        this.setData({
          categories: result.data
        });
      }
    } catch (error) {
      console.error('加载分类列表失败:', error);
      throw error;
    }
  },

  // 加载统计信息
  async loadStats() {
    try {
      const result = await cloudApiService.getStats();
      if (result.success) {
        this.setData({
          stats: result.data
        });
      }
    } catch (error) {
      console.error('加载统计信息失败:', error);
      throw error;
    }
  },

  // 刷新数据
  async refreshData() {
    wx.showLoading({ title: '刷新中...' });
    try {
      await this.loadData();
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 添加菜谱
  addRecipe() {
    wx.navigateTo({
      url: '/pages/recipe-add/recipe-add'
    });
  },

  // 编辑菜谱
  editRecipe(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/recipe-edit/recipe-edit?id=${id}`
    });
  },

  // 删除菜谱
  deleteRecipe(e) {
    const id = e.currentTarget.dataset.id;
    const recipe = this.data.recipes.find(item => item._id === id);
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除菜谱"${recipe.title}"吗？此操作不可恢复。`,
      success: async (res) => {
        if (res.confirm) {
          await this.performDelete(id);
        }
      }
    });
  },

  // 执行删除
  async performDelete(id) {
    try {
      wx.showLoading({ title: '删除中...' });
      
      const result = await cloudApiService.deleteRecipe(id);
      
      if (result.success) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        
        // 刷新列表
        await this.loadRecipes();
      } else {
        throw new Error(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除菜谱失败:', error);
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 分类筛选
  onCategoryFilterChange(e) {
    const index = e.detail.value;
    this.setData({
      filterCategoryIndex: index
    });
    this.loadRecipes();
  },

  // 难度筛选
  onDifficultyFilterChange(e) {
    const index = e.detail.value;
    this.setData({
      filterDifficultyIndex: index
    });
    this.loadRecipes();
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索确认
  onSearch() {
    this.loadRecipes();
  },

  // 加载更多
  async loadMore() {
    if (this.data.isLoading || !this.data.hasMore) {
      return;
    }
    
    try {
      this.setData({ isLoading: true });
      
      const params = {
        page: this.data.currentPage + 1,
        limit: 20,
        isActive: true
      };
      
      // 添加筛选条件
      if (this.data.filterCategoryIndex >= 0) {
        params.category = this.data.categories[this.data.filterCategoryIndex].value;
      }
      
      if (this.data.filterDifficultyIndex >= 0) {
        params.difficulty = this.data.difficulties[this.data.filterDifficultyIndex];
      }
      
      if (this.data.searchKeyword) {
        params.search = this.data.searchKeyword;
      }
      
      const result = await cloudApiService.getRecipes(params);
      
      if (result.success) {
        const newRecipes = [...this.data.recipes, ...result.data.recipes];
        this.setData({
          recipes: newRecipes,
          currentPage: this.data.currentPage + 1,
          hasMore: newRecipes.length < result.data.total
        });
      }
    } catch (error) {
      console.error('加载更多失败:', error);
      wx.showToast({
        title: '加载更多失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isLoading: false });
    }
  }
});

