// 后台管理页面
const cloudApiService = require('../../utils/cloudApi.js');

Page({
  data: {
    logs: [],
    stats: {
      totalRecipes: 0,
      totalCategories: 0,
      recentRecipes: []
    }
  },

  onLoad() {
    console.log('后台管理页面加载');
    this.loadStats();
    this.loadLogs();
  },

  onShow() {
    this.loadStats();
  },

  // 加载统计信息
  async loadStats() {
    try {
      const response = await cloudApiService.getStats();
      if (response.success) {
        this.setData({
          stats: response.data
        });
        this.addLog('统计信息加载成功', 'success');
      }
    } catch (error) {
      console.error('加载统计信息失败:', error);
      this.addLog('加载统计信息失败', 'error');
    }
  },

  // 加载日志
  loadLogs() {
    // 模拟日志数据
    const logs = [
      {
        time: new Date().toLocaleTimeString(),
        message: '系统初始化完成',
        type: 'success'
      },
      {
        time: new Date().toLocaleTimeString(),
        message: '后台管理页面加载',
        type: 'info'
      }
    ];
    
    this.setData({ logs });
  },

  // 跳转到菜谱管理页面
  goToRecipeManage() {
    this.addLog('跳转到菜谱管理页面', 'info');
    wx.navigateTo({
      url: '/pages/recipe-manage/recipe-manage'
    });
  },

  // 跳转到添加菜谱页面
  goToRecipeAdd() {
    this.addLog('跳转到添加菜谱页面', 'info');
    wx.navigateTo({
      url: '/pages/recipe-add/recipe-add'
    });
  },

  // 测试连接
  async testConnection() {
    this.addLog('测试云函数连接...', 'info');
    
    wx.showLoading({
      title: '测试中...'
    });
    
    try {
      const response = await cloudApiService.getStats();
      wx.hideLoading();
      
      if (response.success) {
        this.addLog('连接测试成功', 'success');
        wx.showToast({
          title: '连接正常',
          icon: 'success'
        });
      } else {
        throw new Error(response.message || '连接失败');
      }
    } catch (error) {
      wx.hideLoading();
      this.addLog(`连接测试失败: ${error.message}`, 'error');
      wx.showToast({
        title: '连接失败',
        icon: 'none'
      });
    }
  },

  // 初始化数据
  async initData() {
    this.addLog('开始初始化数据...', 'info');
    
    wx.showModal({
      title: '确认初始化',
      content: '确定要初始化数据吗？这将添加示例菜谱和分类数据。',
      success: async (res) => {
        if (res.confirm) {
          await this.performInitData();
        }
      }
    });
  },

  // 执行初始化数据
  async performInitData() {
    try {
      wx.showLoading({
        title: '初始化中...'
      });
      
      // 调用初始化云函数
      const result = await wx.cloud.callFunction({
        name: 'init-database'
      });
      
      wx.hideLoading();
      
      if (result.result.success) {
        this.addLog('数据初始化成功', 'success');
        wx.showToast({
          title: '初始化成功',
          icon: 'success'
        });
        this.loadStats();
      } else {
        throw new Error(result.result.message || '初始化失败');
      }
    } catch (error) {
      wx.hideLoading();
      this.addLog(`初始化失败: ${error.message}`, 'error');
      wx.showToast({
        title: '初始化失败',
        icon: 'none'
      });
    }
  },

  // 清空所有数据
  clearData() {
    this.addLog('准备清空所有数据...', 'warning');
    
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有数据吗？此操作不可恢复！',
      confirmColor: '#ff4757',
      success: async (res) => {
        if (res.confirm) {
          await this.performClearData();
        }
      }
    });
  },

  // 执行清空所有数据
  async performClearData() {
    try {
      wx.showLoading({
        title: '清空中...'
      });
      
      // 使用快速清空脚本
      const db = wx.cloud.database();
      let totalCleared = 0;
      
      // 清空菜谱数据
      const recipesResult = await db.collection('recipes').get();
      for (const recipe of recipesResult.data) {
        await db.collection('recipes').doc(recipe._id).remove();
        totalCleared++;
      }
      
      // 清空分类数据
      const categoriesResult = await db.collection('categories').get();
      for (const category of categoriesResult.data) {
        await db.collection('categories').doc(category._id).remove();
        totalCleared++;
      }
      
      // 清空用户收藏数据
      const favoritesResult = await db.collection('user_favorites').get();
      for (const favorite of favoritesResult.data) {
        await db.collection('user_favorites').doc(favorite._id).remove();
        totalCleared++;
      }
      
      // 清空用户评分数据
      const ratingsResult = await db.collection('user_ratings').get();
      for (const rating of ratingsResult.data) {
        await db.collection('user_ratings').doc(rating._id).remove();
        totalCleared++;
      }
      
      wx.hideLoading();
      
      this.addLog(`清空完成，共删除 ${totalCleared} 条数据`, 'success');
      wx.showToast({
        title: '清空完成',
        icon: 'success'
      });
      
      this.loadStats();
    } catch (error) {
      wx.hideLoading();
      this.addLog(`清空失败: ${error.message}`, 'error');
      wx.showToast({
        title: '清空失败',
        icon: 'none'
      });
    }
  },

  // 清空菜谱数据
  clearRecipes() {
    this.addLog('准备清空菜谱数据...', 'warning');
    
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有菜谱数据吗？此操作不可恢复！',
      confirmColor: '#ff4757',
      success: async (res) => {
        if (res.confirm) {
          await this.performClearRecipes();
        }
      }
    });
  },

  // 执行清空菜谱数据
  async performClearRecipes() {
    try {
      wx.showLoading({
        title: '清空中...'
      });
      
      const db = wx.cloud.database();
      const recipesResult = await db.collection('recipes').get();
      
      for (const recipe of recipesResult.data) {
        await db.collection('recipes').doc(recipe._id).remove();
      }
      
      wx.hideLoading();
      
      this.addLog(`清空菜谱完成，共删除 ${recipesResult.data.length} 个菜谱`, 'success');
      wx.showToast({
        title: '清空完成',
        icon: 'success'
      });
      
      this.loadStats();
    } catch (error) {
      wx.hideLoading();
      this.addLog(`清空菜谱失败: ${error.message}`, 'error');
      wx.showToast({
        title: '清空失败',
        icon: 'none'
      });
    }
  },

  // 清空分类数据
  clearCategories() {
    this.addLog('准备清空分类数据...', 'warning');
    
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有分类数据吗？此操作不可恢复！',
      confirmColor: '#ff4757',
      success: async (res) => {
        if (res.confirm) {
          await this.performClearCategories();
        }
      }
    });
  },

  // 执行清空分类数据
  async performClearCategories() {
    try {
      wx.showLoading({
        title: '清空中...'
      });
      
      const db = wx.cloud.database();
      const categoriesResult = await db.collection('categories').get();
      
      for (const category of categoriesResult.data) {
        await db.collection('categories').doc(category._id).remove();
      }
      
      wx.hideLoading();
      
      this.addLog(`清空分类完成，共删除 ${categoriesResult.data.length} 个分类`, 'success');
      wx.showToast({
        title: '清空完成',
        icon: 'success'
      });
      
      this.loadStats();
    } catch (error) {
      wx.hideLoading();
      this.addLog(`清空分类失败: ${error.message}`, 'error');
      wx.showToast({
        title: '清空失败',
        icon: 'none'
      });
    }
  },

  // 刷新日志
  refreshLogs() {
    this.addLog('刷新日志', 'info');
    this.loadLogs();
  },

  // 添加日志
  addLog(message, type = 'info') {
    const logs = this.data.logs;
    logs.unshift({
      time: new Date().toLocaleTimeString(),
      message,
      type
    });
    
    // 只保留最近20条日志
    if (logs.length > 20) {
      logs.splice(20);
    }
    
    this.setData({ logs });
  }
});