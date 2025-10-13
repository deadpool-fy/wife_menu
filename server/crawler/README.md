# 小红书菜谱爬虫服务

这是一个基于Node.js的小红书菜谱数据爬虫服务，用于自动爬取菜谱数据并存储到MySQL数据库中。

## 🚀 功能特性

- **自动爬取**: 每天零点自动从小红书爬取最新菜谱数据
- **智能分类**: 根据菜谱内容自动分类（荤菜、素菜、汤类等）
- **数据清洗**: 自动生成食材清单、制作步骤、营养信息等
- **定时任务**: 支持定时爬取和清理旧数据
- **RESTful API**: 提供完整的API接口供小程序调用
- **日志记录**: 完整的爬取日志和错误处理

## 📋 系统要求

- Node.js >= 16.0.0
- MySQL >= 5.7
- 内存 >= 2GB
- 磁盘空间 >= 1GB

## 🛠 安装配置

### 1. 安装依赖

```bash
cd server/crawler
npm install
```

### 2. 配置环境变量

复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wife_menu
DB_USER=root
DB_PASSWORD=your_password

# 爬虫配置
CRAWLER_DELAY=2000
CRAWLER_MAX_PAGES=10
CRAWLER_USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36

# 服务器配置
PORT=3001
NODE_ENV=production

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/crawler.log
```

### 3. 创建数据库

```sql
CREATE DATABASE wife_menu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start

# 手动执行爬虫
npm run crawl
```

## 📊 数据库结构

### recipes 表
存储菜谱信息，包括标题、描述、图片、分类、难度、制作时间、食材清单、制作步骤等。

### categories 表
存储菜谱分类信息。

### crawl_logs 表
记录爬取任务的执行日志。

## 🔌 API接口

### 菜谱相关

- `GET /api/recipes` - 获取菜谱列表
- `GET /api/recipes/:id` - 获取菜谱详情
- `GET /api/recipes/featured` - 获取推荐菜谱
- `PUT /api/recipes/:id/rating` - 更新菜谱评分

### 统计相关

- `GET /api/categories/stats` - 获取分类统计

### 爬虫相关

- `POST /api/crawl/manual` - 手动执行爬虫
- `GET /api/crawl/status` - 获取爬虫状态
- `GET /api/crawl/logs` - 获取爬取日志

### 系统相关

- `GET /api/health` - 健康检查

## ⏰ 定时任务

- **每日爬取**: 每天 00:00 自动爬取小红书菜谱数据
- **每周清理**: 每周日 02:00 清理30天前的旧数据
- **健康检查**: 每小时检查服务状态

## 📝 使用示例

### 获取菜谱列表

```javascript
// 获取第一页菜谱
fetch('http://localhost:3001/api/recipes?page=1&limit=20')
  .then(response => response.json())
  .then(data => console.log(data));

// 按分类筛选
fetch('http://localhost:3001/api/recipes?category=荤菜&page=1')
  .then(response => response.json())
  .then(data => console.log(data));

// 搜索菜谱
fetch('http://localhost:3001/api/recipes?search=红烧肉')
  .then(response => response.json())
  .then(data => console.log(data));
```

### 手动执行爬虫

```javascript
// 执行爬虫任务
fetch('http://localhost:3001/api/crawl/manual', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    keywords: ['家常菜', '快手菜', '下饭菜']
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🔧 配置说明

### 爬虫配置

- `CRAWLER_DELAY`: 请求间隔时间（毫秒）
- `CRAWLER_MAX_PAGES`: 最大爬取页数
- `CRAWLER_USER_AGENT`: 浏览器用户代理

### 数据库配置

- `DB_HOST`: 数据库主机
- `DB_PORT`: 数据库端口
- `DB_NAME`: 数据库名称
- `DB_USER`: 数据库用户名
- `DB_PASSWORD`: 数据库密码

## 📈 监控和日志

### 日志文件

- `logs/combined.log` - 所有日志
- `logs/error.log` - 错误日志
- `logs/crawler.log` - 爬虫专用日志

### 监控指标

- 爬取成功率
- 数据质量评分
- 系统资源使用情况
- 错误率统计

## 🚨 注意事项

1. **遵守robots.txt**: 请遵守小红书的爬虫协议
2. **合理频率**: 避免过于频繁的请求导致IP被封
3. **数据质量**: 定期检查爬取数据的质量
4. **法律合规**: 确保爬取行为符合相关法律法规

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库配置
   - 确认数据库服务是否启动
   - 检查网络连接

2. **爬虫无法获取数据**
   - 检查网络连接
   - 更新User-Agent
   - 增加请求延迟

3. **内存不足**
   - 减少并发请求
   - 增加系统内存
   - 优化代码逻辑

### 调试模式

```bash
# 开启调试模式
NODE_ENV=development npm run dev

# 查看详细日志
LOG_LEVEL=debug npm start
```

## 📞 技术支持

如有问题，请查看日志文件或联系技术支持。

## 📄 许可证

MIT License
