# 🚀 云函数部署指南

## 🔧 解决云函数执行失败问题

您遇到的错误 `-504002 functions execute fail` 通常是因为云函数代码有问题或依赖缺失。请按照以下步骤重新部署：

### 步骤1: 重新部署云函数

#### 1.1 部署 crawler 云函数
1. 在微信开发者工具中，右键 `cloudfunctions/crawler` 文件夹
2. 选择「上传并部署：云端安装依赖」
3. 等待部署完成

#### 1.2 部署 init-database 云函数
1. 在微信开发者工具中，右键 `cloudfunctions/init-database` 文件夹
2. 选择「上传并部署：云端安装依赖」
3. 等待部署完成

### 步骤2: 测试云函数

在微信开发者工具的控制台中执行以下代码测试云函数：

```javascript
// 测试云函数连接
wx.cloud.init({
  env: 'cloud1-5ga4h58zc0ea35dc',
  traceUser: true,
});

// 测试 crawler 云函数
async function testCrawler() {
  try {
    const result = await wx.cloud.callFunction({
      name: 'crawler',
      data: {
        action: 'getStats'
      }
    });
    console.log('✅ crawler 云函数测试成功:', result);
  } catch (error) {
    console.error('❌ crawler 云函数测试失败:', error);
  }
}

// 测试 init-database 云函数
async function testInitDatabase() {
  try {
    const result = await wx.cloud.callFunction({
      name: 'init-database'
    });
    console.log('✅ init-database 云函数测试成功:', result);
  } catch (error) {
    console.error('❌ init-database 云函数测试失败:', error);
  }
}

// 执行测试
testCrawler();
testInitDatabase();
```

### 步骤3: 初始化数据库

如果云函数测试成功，执行数据库初始化：

```javascript
// 初始化数据库
async function initDatabase() {
  try {
    const result = await wx.cloud.callFunction({
      name: 'init-database'
    });
    
    if (result.result.success) {
      console.log('✅ 数据库初始化成功');
    } else {
      console.error('❌ 数据库初始化失败:', result.result.message);
    }
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
  }
}

initDatabase();
```

### 步骤4: 测试爬虫功能

```javascript
// 测试爬虫功能
async function testCrawler() {
  try {
    const result = await wx.cloud.callFunction({
      name: 'crawler',
      data: {
        action: 'crawlRecipes',
        data: {
          keywords: ['家常菜', '快手菜']
        }
      }
    });
    
    if (result.result.success) {
      console.log('✅ 爬虫测试成功:', result.result);
    } else {
      console.error('❌ 爬虫测试失败:', result.result.message);
    }
  } catch (error) {
    console.error('❌ 爬虫测试失败:', error);
  }
}

testCrawler();
```

## 🔍 常见问题解决

### 问题1: 云函数部署失败
**解决方案**:
1. 检查云开发环境是否正确配置
2. 确认云函数代码没有语法错误
3. 重新部署云函数

### 问题2: 依赖安装失败
**解决方案**:
1. 检查 `package.json` 中的依赖是否正确
2. 移除不必要的依赖
3. 重新部署云函数

### 问题3: 云函数执行超时
**解决方案**:
1. 简化云函数逻辑
2. 减少数据库操作
3. 设置合理的超时时间

### 问题4: 数据库权限问题
**解决方案**:
1. 检查云开发控制台的数据库权限设置
2. 确认云函数有数据库访问权限
3. 重新配置数据库权限

## 📊 部署状态检查

### 检查云函数是否部署成功
1. 打开微信开发者工具
2. 点击「云开发」按钮
3. 进入「云函数」页面
4. 查看云函数列表，确认 `crawler` 和 `init-database` 已部署

### 检查云函数日志
1. 在云开发控制台中点击云函数名称
2. 查看「日志」标签页
3. 检查是否有错误信息

### 检查数据库权限
1. 在云开发控制台中进入「数据库」页面
2. 检查集合权限设置
3. 确认云函数有读写权限

## 🎯 成功标志

当您看到以下信息时，说明部署成功：

- 云函数部署状态显示「正常」
- 测试代码执行成功，没有错误
- 数据库初始化成功
- 爬虫功能可以正常调用

## 🚨 如果仍然失败

如果按照上述步骤操作后仍然失败，请：

1. **检查云开发环境配置**
   - 确认环境ID是否正确
   - 检查云开发是否已开通

2. **查看详细错误信息**
   - 在云开发控制台查看云函数日志
   - 检查具体的错误信息

3. **重新创建云函数**
   - 删除现有的云函数
   - 重新创建和部署

4. **联系技术支持**
   - 提供详细的错误信息
   - 说明具体的操作步骤

现在请按照上述步骤重新部署云函数，应该能解决您遇到的问题！

