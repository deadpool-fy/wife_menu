// 小红书菜谱爬虫API服务
const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = 10000; // 10秒超时
  }

  // 通用请求方法
  async request(url, options = {}) {
    const config = {
      timeout: this.timeout,
      ...options
    };

    try {
      const response = await wx.request({
        url: `${this.baseURL}${url}`,
        ...config
      });

      if (response.statusCode === 200) {
        return response.data;
      } else {
        throw new Error(`请求失败: ${response.statusCode}`);
      }
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  // 获取菜谱列表
  async getRecipes(params = {}) {
    const queryString = this.buildQueryString(params);
    return await this.request(`/recipes${queryString}`);
  }

  // 获取菜谱详情
  async getRecipeById(id) {
    return await this.request(`/recipes/${id}`);
  }

  // 获取推荐菜谱
  async getFeaturedRecipes(limit = 10) {
    return await this.request(`/recipes/featured?limit=${limit}`);
  }

  // 获取分类统计
  async getCategoryStats() {
    return await this.request('/categories/stats');
  }

  // 更新菜谱评分
  async updateRecipeRating(id, rating) {
    return await this.request(`/recipes/${id}/rating`, {
      method: 'PUT',
      data: { rating }
    });
  }

  // 手动执行爬虫
  async runManualCrawl(keywords = ['家常菜', '快手菜']) {
    return await this.request('/crawl/manual', {
      method: 'POST',
      data: { keywords }
    });
  }

  // 获取爬虫状态
  async getCrawlStatus() {
    return await this.request('/crawl/status');
  }

  // 获取爬取日志
  async getCrawlLogs(params = {}) {
    const queryString = this.buildQueryString(params);
    return await this.request(`/crawl/logs${queryString}`);
  }

  // 健康检查
  async healthCheck() {
    return await this.request('/health');
  }

  // 构建查询字符串
  buildQueryString(params) {
    const query = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    return query ? `?${query}` : '';
  }
}

// 创建API服务实例
const apiService = new ApiService();

module.exports = apiService;
