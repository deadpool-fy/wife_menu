const puppeteer = require('puppeteer');
const { crawlerLogger } = require('../utils/logger');

class XiaohongshuCrawler {
  constructor(options = {}) {
    this.options = {
      headless: true,
      delay: parseInt(process.env.CRAWLER_DELAY) || 2000,
      maxPages: parseInt(process.env.CRAWLER_MAX_PAGES) || 10,
      userAgent: process.env.CRAWLER_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      ...options
    };
    this.browser = null;
    this.page = null;
  }

  async init() {
    try {
      crawlerLogger.info('🚀 启动小红书爬虫...');
      
      this.browser = await puppeteer.launch({
        headless: this.options.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      
      // 设置用户代理
      await this.page.setUserAgent(this.options.userAgent);
      
      // 设置视口
      await this.page.setViewport({ width: 1366, height: 768 });
      
      // 设置请求拦截
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      crawlerLogger.info('✅ 小红书爬虫初始化完成');
    } catch (error) {
      crawlerLogger.error('❌ 爬虫初始化失败:', error);
      throw error;
    }
  }

  async crawlRecipes(keywords = ['家常菜', '快手菜', '下饭菜', '汤品', '甜品']) {
    const allRecipes = [];
    
    try {
      for (const keyword of keywords) {
        crawlerLogger.info(`🔍 开始爬取关键词: ${keyword}`);
        const recipes = await this.crawlByKeyword(keyword);
        allRecipes.push(...recipes);
        crawlerLogger.info(`✅ 关键词 ${keyword} 爬取完成，获得 ${recipes.length} 个菜谱`);
        
        // 延迟避免被封
        await this.delay(this.options.delay);
      }
      
      crawlerLogger.info(`🎉 所有关键词爬取完成，共获得 ${allRecipes.length} 个菜谱`);
      return allRecipes;
    } catch (error) {
      crawlerLogger.error('❌ 爬取菜谱失败:', error);
      throw error;
    }
  }

  async crawlByKeyword(keyword) {
    const recipes = [];
    
    try {
      // 搜索页面
      const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&type=note`;
      await this.page.goto(searchUrl, { waitUntil: 'networkidle2' });
      
      // 等待页面加载
      await this.delay(3000);
      
      // 滚动页面加载更多内容
      await this.scrollToLoad();
      
      // 获取笔记链接
      const noteLinks = await this.page.evaluate(() => {
        const links = [];
        const elements = document.querySelectorAll('a[href*="/explore/"]');
        elements.forEach(el => {
          const href = el.getAttribute('href');
          if (href && href.includes('/explore/') && !links.includes(href)) {
            links.push(href);
          }
        });
        return links.slice(0, 20); // 限制每个关键词最多20个
      });
      
      crawlerLogger.info(`📝 找到 ${noteLinks.length} 个笔记链接`);
      
      // 逐个访问笔记页面
      for (const link of noteLinks) {
        try {
          const fullUrl = link.startsWith('http') ? link : `https://www.xiaohongshu.com${link}`;
          const recipe = await this.crawlRecipeDetail(fullUrl);
          if (recipe) {
            recipes.push(recipe);
          }
          await this.delay(this.options.delay);
        } catch (error) {
          crawlerLogger.warn(`⚠️ 爬取笔记失败: ${link}`, error.message);
        }
      }
      
    } catch (error) {
      crawlerLogger.error(`❌ 爬取关键词 ${keyword} 失败:`, error);
    }
    
    return recipes;
  }

  async crawlRecipeDetail(url) {
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      await this.delay(2000);
      
      const recipe = await this.page.evaluate(() => {
        // 提取标题
        const titleEl = document.querySelector('.title') || 
                      document.querySelector('h1') || 
                      document.querySelector('[data-testid="note-title"]');
        const title = titleEl ? titleEl.textContent.trim() : '';
        
        // 提取描述
        const descEl = document.querySelector('.desc') || 
                        document.querySelector('.note-content') ||
                        document.querySelector('[data-testid="note-desc"]');
        const description = descEl ? descEl.textContent.trim() : '';
        
        // 提取图片
        const imgEl = document.querySelector('.cover img') || 
                     document.querySelector('.note-cover img') ||
                     document.querySelector('[data-testid="note-cover"] img');
        const imageUrl = imgEl ? imgEl.src : '';
        
        // 提取标签
        const tagEls = document.querySelectorAll('.tag, .note-tag');
        const tags = Array.from(tagEls).map(el => el.textContent.trim()).filter(tag => tag);
        
        // 提取作者
        const authorEl = document.querySelector('.author-name') || 
                        document.querySelector('.user-name') ||
                        document.querySelector('[data-testid="author-name"]');
        const author = authorEl ? authorEl.textContent.trim() : '';
        
        // 提取点赞数
        const likeEl = document.querySelector('.like-count') || 
                      document.querySelector('[data-testid="like-count"]');
        const likeCount = likeEl ? parseInt(likeEl.textContent) || 0 : 0;
        
        // 提取收藏数
        const collectEl = document.querySelector('.collect-count') || 
                         document.querySelector('[data-testid="collect-count"]');
        const collectCount = collectEl ? parseInt(collectEl.textContent) || 0 : 0;
        
        return {
          title,
          description,
          imageUrl,
          tags,
          author,
          likeCount,
          collectCount,
          sourceUrl: window.location.href
        };
      });
      
      // 数据清洗和标准化
      if (recipe.title && recipe.title.length > 2) {
        return this.standardizeRecipe(recipe);
      }
      
      return null;
    } catch (error) {
      crawlerLogger.warn(`⚠️ 爬取详情失败: ${url}`, error.message);
      return null;
    }
  }

  standardizeRecipe(rawRecipe) {
    // 分类映射
    const categoryMap = {
      '家常菜': '荤素搭配',
      '快手菜': '荤素搭配', 
      '下饭菜': '荤菜',
      '汤品': '汤类',
      '甜品': '甜品',
      '素菜': '素菜',
      '荤菜': '荤菜'
    };
    
    // 根据标题和标签判断分类
    let category = '荤素搭配';
    const title = rawRecipe.title.toLowerCase();
    const tags = rawRecipe.tags.join(' ').toLowerCase();
    
    for (const [key, value] of Object.entries(categoryMap)) {
      if (title.includes(key) || tags.includes(key)) {
        category = value;
        break;
      }
    }
    
    // 生成难度
    const difficulty = this.generateDifficulty(rawRecipe);
    
    // 生成制作时间
    const cookingTime = this.generateCookingTime(rawRecipe);
    
    // 生成适合人数
    const servings = this.generateServings(rawRecipe);
    
    // 生成卡路里
    const calories = this.generateCalories(rawRecipe);
    
    // 生成食材清单
    const ingredients = this.generateIngredients(rawRecipe);
    
    // 生成制作步骤
    const steps = this.generateSteps(rawRecipe);
    
    return {
      title: rawRecipe.title,
      description: rawRecipe.description || '美味家常菜，简单易做',
      imageUrl: rawRecipe.imageUrl,
      category,
      difficulty,
      cookingTime,
      servings,
      calories,
      ingredients,
      steps,
      tips: this.generateTips(rawRecipe),
      author: rawRecipe.author || '小红书用户',
      sourceUrl: rawRecipe.sourceUrl,
      tags: rawRecipe.tags,
      rating: 0,
      viewCount: 0,
      likeCount: rawRecipe.likeCount || 0,
      isFeatured: rawRecipe.likeCount > 100,
      isActive: true
    };
  }

  generateDifficulty(recipe) {
    const title = recipe.title.toLowerCase();
    const tags = recipe.tags.join(' ').toLowerCase();
    
    if (title.includes('简单') || title.includes('快手') || tags.includes('简单')) {
      return '简单';
    } else if (title.includes('复杂') || title.includes('高级') || tags.includes('复杂')) {
      return '困难';
    } else {
      return '中等';
    }
  }

  generateCookingTime(recipe) {
    const title = recipe.title.toLowerCase();
    const tags = recipe.tags.join(' ').toLowerCase();
    
    if (title.includes('快手') || title.includes('5分钟') || tags.includes('快手')) {
      return '5-10分钟';
    } else if (title.includes('30分钟') || tags.includes('30分钟')) {
      return '30-45分钟';
    } else if (title.includes('1小时') || tags.includes('1小时')) {
      return '1-2小时';
    } else {
      return '15-30分钟';
    }
  }

  generateServings(recipe) {
    const title = recipe.title.toLowerCase();
    const tags = recipe.tags.join(' ').toLowerCase();
    
    if (title.includes('一人') || title.includes('单人') || tags.includes('一人')) {
      return 1;
    } else if (title.includes('两人') || title.includes('情侣') || tags.includes('两人')) {
      return 2;
    } else if (title.includes('全家') || title.includes('多人') || tags.includes('全家')) {
      return 4;
    } else {
      return 2;
    }
  }

  generateCalories(recipe) {
    const title = recipe.title.toLowerCase();
    const tags = recipe.tags.join(' ').toLowerCase();
    
    if (title.includes('低卡') || title.includes('减肥') || tags.includes('低卡')) {
      return Math.floor(Math.random() * 100) + 50;
    } else if (title.includes('高热量') || title.includes('甜品') || tags.includes('甜品')) {
      return Math.floor(Math.random() * 300) + 200;
    } else {
      return Math.floor(Math.random() * 200) + 100;
    }
  }

  generateIngredients(recipe) {
    // 根据菜谱标题和描述生成常见食材
    const commonIngredients = [
      { name: '盐', amount: '适量' },
      { name: '生抽', amount: '1勺' },
      { name: '老抽', amount: '半勺' },
      { name: '料酒', amount: '1勺' },
      { name: '食用油', amount: '适量' },
      { name: '葱', amount: '2根' },
      { name: '姜', amount: '3片' },
      { name: '蒜', amount: '3瓣' }
    ];
    
    // 根据分类添加特定食材
    const categoryIngredients = {
      '荤菜': [
        { name: '猪肉', amount: '300g' },
        { name: '牛肉', amount: '300g' },
        { name: '鸡肉', amount: '300g' }
      ],
      '素菜': [
        { name: '青菜', amount: '300g' },
        { name: '豆腐', amount: '200g' },
        { name: '土豆', amount: '2个' }
      ],
      '汤类': [
        { name: '排骨', amount: '500g' },
        { name: '玉米', amount: '1根' },
        { name: '胡萝卜', amount: '1根' }
      ],
      '甜品': [
        { name: '面粉', amount: '200g' },
        { name: '鸡蛋', amount: '2个' },
        { name: '白糖', amount: '50g' }
      ]
    };
    
    const ingredients = [...commonIngredients];
    if (categoryIngredients[recipe.category]) {
      ingredients.push(...categoryIngredients[recipe.category]);
    }
    
    return ingredients.slice(0, 8); // 限制食材数量
  }

  generateSteps(recipe) {
    const steps = [
      {
        step: 1,
        description: '准备所有食材，清洗干净备用',
        image: null
      },
      {
        step: 2,
        description: '将主要食材切成合适大小的块状',
        image: null
      },
      {
        step: 3,
        description: '热锅下油，爆香葱姜蒜',
        image: null
      },
      {
        step: 4,
        description: '下入主要食材翻炒至变色',
        image: null
      },
      {
        step: 5,
        description: '加入调料调味，翻炒均匀',
        image: null
      },
      {
        step: 6,
        description: '根据菜谱要求进行最后的烹饪处理',
        image: null
      }
    ];
    
    return steps;
  }

  generateTips(recipe) {
    const tips = [
      '食材要新鲜，这样口感更好',
      '火候要掌握好，不要炒过头',
      '调料可以根据个人口味适量调整',
      '可以提前准备好所有食材，这样制作更顺利'
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }

  async scrollToLoad() {
    let previousHeight = 0;
    let currentHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 5;
    
    do {
      previousHeight = currentHeight;
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await this.delay(2000);
      
      currentHeight = await this.page.evaluate(() => {
        return document.body.scrollHeight;
      });
      
      scrollAttempts++;
    } while (currentHeight > previousHeight && scrollAttempts < maxScrollAttempts);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      crawlerLogger.info('🔚 爬虫已关闭');
    }
  }
}

module.exports = XiaohongshuCrawler;
