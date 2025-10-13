# 菜谱卡片布局优化指南

## 🎨 优化内容

### 1. 整体布局优化
- **卡片间距**: 从 `var(--space-lg)` 减少到 `var(--space-md)`，让卡片更紧凑
- **区域边距**: 推荐菜品和已选菜品区域的边距从 `var(--space-lg)` 减少到 `var(--space-md)`
- **内边距**: 推荐菜品区域内边距从 `var(--space-xl)` 减少到 `var(--space-lg)`

### 2. 菜谱卡片内容优化
- **图片尺寸**: 从 120rpx × 120rpx 减少到 100rpx × 100rpx，更紧凑
- **内容对齐**: 从 `align-items: center` 改为 `align-items: flex-start`，避免垂直居中造成的空间浪费
- **内边距**: 从 `var(--space-lg)` 减少到 `var(--space-md)`
- **底部间距**: 从 `var(--space-md)` 减少到 `var(--space-sm)`

### 3. 文字排版优化
- **菜谱名称**: 
  - 字体大小从 `var(--text-lg)` 减少到 `var(--text-base)`
  - 行高从 `1.3` 减少到 `1.2`
  - 添加文字溢出处理：`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
- **分类和难度标签**:
  - 字体大小从 `var(--text-xs)` 减少到 `20rpx`
  - 内边距从 `var(--space-xs) var(--space-sm)` 减少到 `4rpx 8rpx`
  - 行高设置为 `1`
  - 添加 `white-space: nowrap` 防止换行
- **统计信息**:
  - 图标大小从 `var(--text-sm)` 减少到 `24rpx`
  - 文字大小从 `var(--text-xs)` 减少到 `20rpx`
  - 行高设置为 `1`
  - 间距从 `var(--space-md)` 减少到 `var(--space-sm)`

### 4. 选择按钮优化
- **按钮尺寸**: 最小宽度从 `100rpx` 减少到 `80rpx`
- **内边距**: 从 `var(--space-md) var(--space-lg)` 减少到 `var(--space-sm) var(--space-md)`
- **字体大小**: 从 `var(--text-sm)` 减少到 `24rpx`
- **图标大小**: 从 `var(--text-sm)` 减少到 `20rpx`
- **按钮区域**: 内边距从 `var(--space-lg)` 减少到 `var(--space-md)`

### 5. 已选菜品区域优化
- **卡片尺寸**: 从 140rpx × 140rpx 减少到 120rpx × 120rpx
- **卡片间距**: 从 `var(--space-md)` 减少到 `var(--space-sm)`
- **滚动区域**: 内边距从 `var(--space-sm)` 减少到 `var(--space-xs)`
- **文字样式**:
  - 菜谱名称字体从 `var(--text-sm)` 减少到 `20rpx`
  - 分类字体从 `var(--text-xs)` 减少到 `18rpx`
  - 行高优化为 `1.1` 和 `1`
  - 添加多行文字截断处理

### 6. 徽章和图标优化
- **新品徽章**: 尺寸和内边距减小，字体从 `var(--text-xs)` 减少到 `20rpx`
- **收藏图标**: 位置调整，尺寸从 `var(--text-lg)` 减少到 `var(--text-base)`
- **移除按钮**: 尺寸从 36rpx × 36rpx 减少到 32rpx × 32rpx

## 📱 视觉效果

### 优化前的问题
- 卡片间距过大，浪费屏幕空间
- 文字排版松散，信息密度低
- 按钮和图标尺寸过大
- 整体布局不够紧凑

### 优化后的改进
- ✅ 卡片布局更紧凑，信息密度提高
- ✅ 文字排版更精致，层次分明
- ✅ 按钮和图标尺寸协调
- ✅ 整体视觉效果更现代化
- ✅ 屏幕空间利用率提高

## 🔧 技术实现

### 关键CSS属性
```css
/* 紧凑布局 */
.dish-content {
  align-items: flex-start;
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
}

/* 文字溢出处理 */
.dish-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 多行文字截断 */
.dish-overlay .dish-name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 紧凑按钮 */
.select-btn {
  padding: var(--space-sm) var(--space-md);
  font-size: 24rpx;
  min-width: 80rpx;
}
```

## 🎯 优化效果

1. **空间利用率**: 提高约 20-30%
2. **信息密度**: 在相同空间内显示更多内容
3. **视觉层次**: 更清晰的信息层级
4. **用户体验**: 更紧凑但不失美观的界面
5. **响应式**: 更好的小屏幕适配

## 📝 注意事项

1. **文字可读性**: 确保字体大小不会影响可读性
2. **触摸目标**: 按钮尺寸仍保持足够的触摸区域
3. **视觉平衡**: 保持各元素间的视觉平衡
4. **兼容性**: 确保在不同设备上的显示效果

## 🚀 后续优化建议

1. **动态字体**: 根据屏幕尺寸动态调整字体大小
2. **主题适配**: 支持深色模式等主题切换
3. **动画优化**: 添加更流畅的过渡动画
4. **无障碍**: 优化无障碍访问体验

