// utils/share.js
// 微信分享工具

// 分享菜单到微信
function shareMenuToWeChat(dishes, date) {
  let shareContent = `今天中午的菜单：\n\n`
  dishes.forEach((dish, index) => {
    shareContent += `${index + 1}. ${dish.name}\n`
  })
  shareContent += `\n时间：${date}`
  
  return {
    title: '今天中午吃什么？',
    desc: shareContent,
    path: '/pages/index/index'
  }
}

// 分享单个菜品到微信
function shareDishToWeChat(dish) {
  let shareContent = `推荐一道美味的${dish.name}！\n\n`
  shareContent += `难度：${dish.difficulty}\n`
  shareContent += `制作时间：${dish.cookingTime}\n`
  shareContent += `适合人数：${dish.servings}人\n\n`
  shareContent += `食材清单：\n`
  dish.ingredients.slice(0, 5).forEach(ingredient => {
    shareContent += `• ${ingredient.name} ${ingredient.amount}\n`
  })
  if (dish.ingredients.length > 5) {
    shareContent += `...等${dish.ingredients.length}种食材\n`
  }
  
  return {
    title: `推荐一道美味的${dish.name}`,
    desc: shareContent,
    path: `/pages/detail/detail?id=${dish.id}`
  }
}

// 分享评价到微信
function shareRatingToWeChat(ratings, date) {
  let shareContent = `今天的菜品评价：\n\n`
  ratings.forEach((dish, index) => {
    shareContent += `${index + 1}. ${dish.name}\n`
    if (dish.rating > 0) {
      shareContent += `评分：${dish.rating}分\n`
    }
    if (dish.comment.trim()) {
      shareContent += `评价：${dish.comment}\n`
    }
    shareContent += `\n`
  })
  
  shareContent += `评价时间：${date}`
  
  return {
    title: '今天的菜品评价',
    desc: shareContent,
    path: '/pages/rating/rating'
  }
}

// 发送消息到微信（模拟）
function sendMessageToWeChat(content) {
  return new Promise((resolve, reject) => {
    // 这里应该调用微信的发送消息API
    // 现在只是模拟发送成功
    setTimeout(() => {
      console.log('发送到微信的消息：', content)
      resolve({
        success: true,
        message: '发送成功'
      })
    }, 1000)
  })
}

// 获取分享图片
function getShareImage(dish) {
  // 这里可以生成分享图片，现在返回菜品原图
  return dish.image
}

// 生成分享二维码
function generateShareQRCode(content) {
  // 这里可以生成二维码，现在返回占位符
  return 'https://via.placeholder.com/200x200/ff6b6b/ffffff?text=QR'
}

module.exports = {
  shareMenuToWeChat,
  shareDishToWeChat,
  shareRatingToWeChat,
  sendMessageToWeChat,
  getShareImage,
  generateShareQRCode
}
