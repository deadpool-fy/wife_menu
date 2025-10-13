// 小程序配置文件
const config = {
  // API配置
  api: {
    baseURL: 'http://localhost:3001/api',
    timeout: 10000,
    retryCount: 3,
    retryDelay: 1000
  },
  
  // 分页配置
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    expireTime: 5 * 60 * 1000, // 5分钟
    maxSize: 50 // 最大缓存条目数
  },
  
  // 图片配置
  image: {
    defaultImage: '/images/default-dish.png',
    placeholder: '/images/placeholder.png',
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  },
  
  // 分类配置
  categories: [
    { id: 'all', name: '全部', icon: '🍽️' },
    { id: 'meat', name: '荤菜', icon: '🥩' },
    { id: 'vegetable', name: '素菜', icon: '🥬' },
    { id: 'mixed', name: '荤素搭配', icon: '🥘' },
    { id: 'soup', name: '汤类', icon: '🍲' },
    { id: 'dessert', name: '甜品', icon: '🍰' }
  ],
  
  // 难度配置
  difficulties: [
    { id: 'simple', name: '简单', color: '#52c41a' },
    { id: 'medium', name: '中等', color: '#faad14' },
    { id: 'hard', name: '困难', color: '#ff4d4f' }
  ],
  
  // 评分配置
  rating: {
    min: 0,
    max: 5,
    step: 0.5
  },
  
  // 搜索配置
  search: {
    minLength: 2,
    maxLength: 50,
    debounceTime: 500
  },
  
  // 分享配置
  share: {
    title: '今天中午吃什么？',
    desc: '发现美味菜谱，轻松做菜',
    path: '/pages/index/index'
  },
  
  // 错误配置
  error: {
    networkError: '网络连接失败，请检查网络设置',
    serverError: '服务器错误，请稍后重试',
    dataError: '数据加载失败，请刷新重试',
    timeoutError: '请求超时，请稍后重试'
  },
  
  // 提示配置
  tips: {
    loading: '加载中...',
    noData: '暂无数据',
    noMore: '没有更多了',
    refresh: '下拉刷新',
    pullUp: '上拉加载更多'
  }
};

module.exports = config;
