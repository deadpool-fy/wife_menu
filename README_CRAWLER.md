# 小红书菜谱爬虫系统

这是一个完整的菜谱数据爬虫系统，包括后端爬虫服务和小程序前端，用于从小红书爬取菜谱数据并提供给微信小程序使用。

## 🎯 项目概述

### 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   微信小程序     │    │   爬虫后端服务   │    │   MySQL数据库   │
│                │    │                │    │                │
│  - 首页展示     │◄──►│  - 数据爬取     │◄──►│  - 菜谱数据     │
│  - 分类浏览     │    │  - API接口     │    │  - 用户数据     │
│  - 详情查看     │    │  - 定时任务     │    │  - 爬取日志     │
│  - 评分收藏     │    │  - 数据验证     │    │                │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 主要功能

- **自动爬取**: 每天零点自动从小红书爬取最新菜谱数据
- **智能分类**: 根据菜谱内容自动分类（荤菜、素菜、汤类等）
- **数据清洗**: 自动生成食材清单、制作步骤、营养信息等
- **定时任务**: 支持定时爬取和清理旧数据
- **RESTful API**: 提供完整的API接口供小程序调用
- **数据验证**: 完整的数据验证和错误处理机制
- **监控告警**: 系统监控和异常告警功能

## 🚀 快速开始

### 1. 环境要求

- Node.js >= 16.0.0
- MySQL >= 5.7
- 微信开发者工具
- 内存 >= 2GB
- 磁盘空间 >= 1GB

### 2. 后端服务部署

#### 2.1 安装依赖

```bash
cd server/crawler
npm install
```

#### 2.2 配置环境变量

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
```

#### 2.3 创建数据库

```sql
CREATE DATABASE wife_menu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2.4 启动服务

```bash
# 使用启动脚本
chmod +x start.sh
./start.sh

# 或手动启动
npm start
```

### 3. 小程序配置

#### 3.1 修改API配置

编辑 `utils/config.js` 文件，修改API地址：

```javascript
const config = {
  api: {
    baseURL: 'http://your-server-ip:3001/api', // 修改为你的服务器地址
    timeout: 10000,
    retryCount: 3,
    retryDelay: 1000
  }
  // ... 其他配置
};
```

#### 3.2 配置小程序域名

在微信公众平台配置服务器域名：

- request合法域名: `https://your-domain.com`
- socket合法域名: `wss://your-domain.com`

#### 3.3 启动小程序

使用微信开发者工具打开项目根目录，点击编译运行。

## 📊 数据流程

### 1. 数据爬取流程

```
小红书网站 → 爬虫服务 → 数据清洗 → 数据验证 → 数据库存储
```

### 2. 数据使用流程

```
小程序前端 → API接口 → 数据库查询 → 数据返回 → 前端展示
```

### 3. 定时任务流程

```
定时器触发 → 爬虫执行 → 数据保存 → 日志记录 → 告警检查
```

## 🔧 配置说明

### 后端配置

#### 爬虫配置

- `CRAWLER_DELAY`: 请求间隔时间（毫秒）
- `CRAWLER_MAX_PAGES`: 最大爬取页数
- `CRAWLER_USER_AGENT`: 浏览器用户代理

#### 数据库配置

- `DB_HOST`: 数据库主机
- `DB_PORT`: 数据库端口
- `DB_NAME`: 数据库名称
- `DB_USER`: 数据库用户名
- `DB_PASSWORD`: 数据库密码

#### 服务器配置

- `PORT`: 服务端口
- `NODE_ENV`: 运行环境
- `LOG_LEVEL`: 日志级别

### 小程序配置

#### API配置

- `baseURL`: API基础地址
- `timeout`: 请求超时时间
- `retryCount`: 重试次数
- `retryDelay`: 重试延迟

#### 缓存配置

- `enabled`: 是否启用缓存
- `expireTime`: 缓存过期时间
- `maxSize`: 最大缓存条目数

## 📈 监控和维护

### 日志文件

- `logs/combined.log` - 所有日志
- `logs/error.log` - 错误日志
- `logs/crawler.log` - 爬虫专用日志

### 监控指标

- 爬取成功率
- 数据质量评分
- 系统资源使用情况
- 错误率统计

### 告警机制

- 错误率过高告警
- 响应时间过长告警
- 内存使用率过高告警
- 数据库连接数过多告警

## 🚨 注意事项

### 法律合规

1. **遵守robots.txt**: 请遵守小红书的爬虫协议
2. **合理频率**: 避免过于频繁的请求导致IP被封
3. **数据质量**: 定期检查爬取数据的质量
4. **法律合规**: 确保爬取行为符合相关法律法规

### 技术注意事项

1. **网络环境**: 确保服务器网络稳定
2. **资源监控**: 定期检查服务器资源使用情况
3. **数据备份**: 定期备份数据库数据
4. **安全防护**: 配置防火墙和安全策略

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

3. **小程序无法连接API**
   - 检查API地址配置
   - 确认服务器是否启动
   - 检查域名配置

4. **内存不足**
   - 减少并发请求
   - 增加系统内存
   - 优化代码逻辑

### 调试模式

```bash
# 后端调试
NODE_ENV=development npm run dev

# 查看详细日志
LOG_LEVEL=debug npm start
```

## 📞 技术支持

如有问题，请查看日志文件或联系技术支持：

- 邮箱: your-email@example.com
- 微信: your-wechat-id
- GitHub: your-github-username

## 📄 许可证

MIT License

## 🔄 更新日志

### v1.0.0 (2024-01-01)

- 初始版本发布
- 支持小红书菜谱数据爬取
- 完整的API接口
- 定时任务系统
- 数据验证和错误处理
- 监控和告警系统
- 微信小程序前端

## 🤝 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目。

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- 邮箱: your-email@example.com
- 微信: your-wechat-id
- GitHub: your-github-username
