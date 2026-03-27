const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event) => {
  const { action, data = {} } = event

  try {
    switch (action) {
      case 'addRecipe':
        return await addRecipe(data)
      case 'updateRecipe':
        return await updateRecipe(data)
      case 'deleteRecipe':
        return await deleteRecipe(data)
      case 'getRecipes':
        return await getRecipes(data)
      case 'getRecipeById':
        return await getRecipeById(data)
      case 'getCategories':
        return await getCategories()
      case 'getStats':
        return await getStats()
      case 'createImportDraft':
        return await createImportDraft(data)
      case 'getImportDrafts':
        return await getImportDrafts(data)
      case 'approveImportDraft':
        return await approveImportDraft(data)
      case 'rejectImportDraft':
        return await rejectImportDraft(data)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('recipe-manager failed:', error)
    return {
      success: false,
      message: error.message,
      error
    }
  }
}

async function addRecipe(data) {
  validateRecipePayload(data)

  const duplicate = await db.collection('recipes').where({
    title: data.title
  }).get()

  if (duplicate.data.length > 0) {
    throw new Error('菜谱标题已存在，请使用不同标题')
  }

  const recipe = buildRecipeRecord(data)
  const result = await db.collection('recipes').add({ data: recipe })

  return {
    success: true,
    message: '菜谱添加成功',
    data: {
      id: result._id,
      recipe
    }
  }
}

async function updateRecipe(data) {
  if (!data.id) {
    throw new Error('菜谱ID不能为空')
  }

  await ensureRecipeExists(data.id)

  const updateData = {
    updatedAt: new Date()
  }

  const editableFields = [
    'title',
    'description',
    'image',
    'category',
    'difficulty',
    'cookingTime',
    'servings',
    'calories',
    'ingredients',
    'steps',
    'tips',
    'author',
    'tags',
    'isFeatured',
    'isActive'
  ]

  editableFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      updateData[field] = data[field]
    }
  })

  await db.collection('recipes').doc(data.id).update({
    data: updateData
  })

  return {
    success: true,
    message: '菜谱更新成功'
  }
}

async function deleteRecipe(data) {
  if (!data.id) {
    throw new Error('菜谱ID不能为空')
  }

  await ensureRecipeExists(data.id)
  await db.collection('recipes').doc(data.id).remove()

  return {
    success: true,
    message: '菜谱删除成功'
  }
}

async function getRecipes(data) {
  const {
    page = 1,
    limit = 20,
    category,
    difficulty,
    search,
    isActive = true
  } = data

  const where = {}
  if (category) where.category = category
  if (difficulty) where.difficulty = difficulty
  if (typeof isActive === 'boolean') where.isActive = isActive
  if (search) {
    where.title = db.RegExp({
      regexp: escapeRegExp(search),
      options: 'i'
    })
  }

  const collection = db.collection('recipes')
  const query = Object.keys(where).length ? collection.where(where) : collection

  const result = await query
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * limit)
    .limit(limit)
    .get()

  const countResult = await (Object.keys(where).length ? collection.where(where) : collection).count()

  return {
    success: true,
    data: {
      recipes: result.data,
      total: countResult.total,
      page,
      limit
    }
  }
}

async function getRecipeById(data) {
  if (!data.id) {
    throw new Error('菜谱ID不能为空')
  }

  const result = await db.collection('recipes').doc(data.id).get()
  if (!result.data) {
    throw new Error('菜谱不存在')
  }

  return {
    success: true,
    data: result.data
  }
}

async function getCategories() {
  const result = await db.collection('categories')
    .orderBy('sortOrder', 'asc')
    .get()

  return {
    success: true,
    data: result.data
  }
}

async function getStats() {
  const [recipesResult, categoriesResult, recentRecipesResult, pendingImportsResult] = await Promise.all([
    db.collection('recipes').count(),
    db.collection('categories').count(),
    db.collection('recipes').orderBy('createdAt', 'desc').limit(5).get(),
    db.collection('recipe_imports').where({ status: 'pending' }).count().catch(() => ({ total: 0 }))
  ])

  return {
    success: true,
    data: {
      totalRecipes: recipesResult.total,
      totalCategories: categoriesResult.total,
      recentRecipes: recentRecipesResult.data,
      featuredRecipes: recentRecipesResult.data.length,
      pendingImports: pendingImportsResult.total || 0
    }
  }
}

async function createImportDraft(data) {
  const sourcePlatform = (data.sourcePlatform || 'manual').trim()
  const sourceUrl = (data.sourceUrl || '').trim()
  const rawText = (data.rawText || '').trim()
  const overrideTitle = (data.title || '').trim()

  if (!rawText && !overrideTitle && !sourceUrl) {
    throw new Error('请至少填写链接、标题或原始菜谱文本')
  }

  const parsed = parseImportedRecipe(rawText)
  const title = overrideTitle || parsed.title || inferTitleFromUrl(sourceUrl)

  if (!title) {
    throw new Error('无法识别菜谱标题，请手动填写后再导入')
  }

  const draft = {
    status: 'pending',
    sourcePlatform,
    sourceUrl,
    originalText: rawText,
    parsedRecipe: {
      title,
      description: parsed.description || '待审核导入草稿，请补充更完整的简介。',
      image: parsed.image || '',
      category: parsed.category || '家常菜',
      difficulty: parsed.difficulty || '简单',
      cookingTime: parsed.cookingTime || '30分钟',
      servings: parsed.servings || 2,
      calories: parsed.calories || 200,
      ingredients: parsed.ingredients,
      steps: parsed.steps,
      tips: parsed.tips || '',
      tags: parsed.tags,
      author: parsed.author || sourcePlatformLabel(sourcePlatform),
      sourceUrl
    },
    reviewNote: '',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await db.collection('recipe_imports').add({
    data: draft
  })

  return {
    success: true,
    message: '导入草稿已创建，等待审核',
    data: {
      id: result._id,
      draft
    }
  }
}

async function getImportDrafts(data) {
  const {
    page = 1,
    limit = 20,
    status = 'pending'
  } = data

  const where = {}
  if (status && status !== 'all') {
    where.status = status
  }

  const collection = db.collection('recipe_imports')
  const query = Object.keys(where).length ? collection.where(where) : collection
  const result = await query
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * limit)
    .limit(limit)
    .get()
  const countResult = await (Object.keys(where).length ? collection.where(where) : collection).count()

  return {
    success: true,
    data: {
      drafts: result.data.map((draft) => ({
        ...draft,
        createdAt: formatDraftDate(draft.createdAt),
        sourcePlatform: sourcePlatformLabel(draft.sourcePlatform)
      })),
      total: countResult.total,
      page,
      limit
    }
  }
}

async function approveImportDraft(data) {
  const { id, reviewNote = '' } = data
  if (!id) {
    throw new Error('草稿ID不能为空')
  }

  const draftResult = await db.collection('recipe_imports').doc(id).get()
  const draft = draftResult.data
  if (!draft) {
    throw new Error('导入草稿不存在')
  }
  if (draft.status !== 'pending') {
    throw new Error('该草稿已处理，不能重复审核')
  }

  const recipePayload = {
    ...draft.parsedRecipe,
    author: draft.parsedRecipe.author || sourcePlatformLabel(draft.sourcePlatform),
    sourceUrl: draft.sourceUrl || draft.parsedRecipe.sourceUrl || '',
    importSource: {
      platform: draft.sourcePlatform,
      url: draft.sourceUrl || '',
      importDraftId: id
    }
  }

  validateRecipePayload(recipePayload)

  const recipe = buildRecipeRecord(recipePayload)
  const addResult = await db.collection('recipes').add({
    data: recipe
  })

  await db.collection('recipe_imports').doc(id).update({
    data: {
      status: 'approved',
      reviewNote,
      recipeId: addResult._id,
      reviewedAt: new Date(),
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    message: '草稿已审核通过并入库',
    data: {
      recipeId: addResult._id
    }
  }
}

async function rejectImportDraft(data) {
  const { id, reviewNote = '' } = data
  if (!id) {
    throw new Error('草稿ID不能为空')
  }

  await db.collection('recipe_imports').doc(id).update({
    data: {
      status: 'rejected',
      reviewNote,
      reviewedAt: new Date(),
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    message: '草稿已驳回'
  }
}

function validateRecipePayload(data) {
  if (!data.title || !String(data.title).trim()) {
    throw new Error('标题为必填项')
  }
  if (!data.description || !String(data.description).trim()) {
    throw new Error('描述为必填项')
  }
  if (!data.category || !String(data.category).trim()) {
    throw new Error('分类为必填项')
  }
  if (!Array.isArray(data.ingredients) || !data.ingredients.length) {
    throw new Error('至少需要一种食材')
  }
  if (!Array.isArray(data.steps) || !data.steps.length) {
    throw new Error('至少需要一个步骤')
  }
}

function buildRecipeRecord(data) {
  return {
    title: String(data.title).trim(),
    description: String(data.description).trim(),
    image: data.image || getDefaultImage(),
    category: data.category || '家常菜',
    difficulty: data.difficulty || '简单',
    cookingTime: data.cookingTime || '30分钟',
    servings: Number(data.servings) || 2,
    calories: Number(data.calories) || 200,
    ingredients: normalizeIngredients(data.ingredients),
    steps: normalizeSteps(data.steps),
    tips: data.tips || '',
    author: data.author || '管理员',
    tags: normalizeTags(data.tags),
    rating: 0,
    viewCount: 0,
    likeCount: 0,
    isFeatured: false,
    isActive: true,
    sourceUrl: data.sourceUrl || '',
    importSource: data.importSource || null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function normalizeIngredients(ingredients = []) {
  return ingredients
    .filter((item) => item && item.name && String(item.name).trim())
    .map((item) => ({
      name: String(item.name).trim(),
      amount: item.amount ? String(item.amount).trim() : '适量'
    }))
}

function normalizeSteps(steps = []) {
  return steps
    .filter((item) => item && item.description && String(item.description).trim())
    .map((item, index) => ({
      step: index + 1,
      description: String(item.description).trim(),
      image: item.image || ''
    }))
}

function normalizeTags(tags = []) {
  return [...new Set((tags || []).map((item) => String(item).trim()).filter(Boolean))]
}

async function ensureRecipeExists(id) {
  const result = await db.collection('recipes').doc(id).get()
  if (!result.data) {
    throw new Error('菜谱不存在')
  }
  return result.data
}

function parseImportedRecipe(rawText) {
  const text = String(rawText || '').replace(/\r/g, '')
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)

  const sectionAliases = {
    ingredients: ['食材', '配料', '用料'],
    steps: ['步骤', '做法', '制作步骤'],
    tips: ['小贴士', '技巧', '备注'],
    tags: ['标签', '关键词'],
    description: ['简介', '描述']
  }

  let currentSection = ''
  const parsed = {
    title: '',
    description: '',
    image: '',
    category: '',
    difficulty: '',
    cookingTime: '',
    servings: 0,
    calories: 0,
    ingredients: [],
    steps: [],
    tips: '',
    tags: [],
    author: ''
  }

  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase()

    if (!parsed.title && index === 0 && !line.includes('：') && line.length <= 30) {
      parsed.title = line
      return
    }

    if (line.includes('：')) {
      const separatorIndex = line.indexOf('：')
      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim()

      if (matchAlias(key, sectionAliases.ingredients)) {
        currentSection = 'ingredients'
        if (value) pushIngredient(parsed.ingredients, value)
        return
      }
      if (matchAlias(key, sectionAliases.steps)) {
        currentSection = 'steps'
        if (value) pushStep(parsed.steps, value)
        return
      }
      if (matchAlias(key, sectionAliases.tips)) {
        currentSection = 'tips'
        parsed.tips = value
        return
      }
      if (matchAlias(key, sectionAliases.tags)) {
        currentSection = 'tags'
        parsed.tags = splitTags(value)
        return
      }
      if (matchAlias(key, sectionAliases.description)) {
        currentSection = 'description'
        parsed.description = value
        return
      }

      switch (key) {
        case '标题':
        case '菜名':
          parsed.title = value
          return
        case '分类':
          parsed.category = value
          return
        case '难度':
          parsed.difficulty = value
          return
        case '时间':
        case '烹饪时间':
        case '制作时间':
          parsed.cookingTime = value
          return
        case '人数':
        case '份量':
        case '适合人数':
          parsed.servings = extractNumber(value) || 0
          return
        case '热量':
        case '卡路里':
          parsed.calories = extractNumber(value) || 0
          return
        case '作者':
        case '来源':
          parsed.author = value
          return
        case '图片':
        case '封面':
          parsed.image = value
          return
        default:
          break
      }
    }

    if (currentSection === 'ingredients') {
      pushIngredient(parsed.ingredients, line)
      return
    }
    if (currentSection === 'steps') {
      pushStep(parsed.steps, line)
      return
    }
    if (currentSection === 'tips') {
      parsed.tips = parsed.tips ? `${parsed.tips}\n${line}` : line
      return
    }
    if (currentSection === 'description') {
      parsed.description = parsed.description ? `${parsed.description}\n${line}` : line
      return
    }
    if (currentSection === 'tags') {
      parsed.tags = [...parsed.tags, ...splitTags(line)]
      return
    }

    if (!parsed.description && line.length > 12 && !lowerLine.startsWith('http')) {
      parsed.description = line
    }
  })

  if (!parsed.ingredients.length) {
    parsed.ingredients = extractLooseIngredients(lines)
  }
  if (!parsed.steps.length) {
    parsed.steps = extractLooseSteps(lines)
  }
  parsed.tags = normalizeTags(parsed.tags)

  return parsed
}

function matchAlias(key, aliases) {
  return aliases.some((alias) => key.includes(alias))
}

function pushIngredient(list, line) {
  const cleaned = line.replace(/^[\-\*\d\.\s]+/, '').trim()
  if (!cleaned) return
  const parts = cleaned.split(/\s+/)
  if (parts.length === 1) {
    list.push({ name: parts[0], amount: '适量' })
    return
  }
  const amount = parts.pop()
  list.push({
    name: parts.join(' '),
    amount
  })
}

function pushStep(list, line) {
  const cleaned = line.replace(/^[第\s]*\d+[步\.\、:\s-]*/, '').trim()
  if (!cleaned) return
  list.push({
    step: list.length + 1,
    description: cleaned
  })
}

function extractLooseIngredients(lines) {
  return lines
    .filter((line) => /g|克|勺|汤匙|适量|个|片|ml|毫升|斤/.test(line))
    .slice(0, 12)
    .map((line) => {
      const match = line.match(/^(.+?)[\s:：-]+(.+)$/)
      return match
        ? { name: match[1].trim(), amount: match[2].trim() }
        : { name: line.trim(), amount: '适量' }
    })
}

function extractLooseSteps(lines) {
  return lines
    .filter((line) => /^(\d+[\.\、]|第?\d+步)/.test(line))
    .map((line, index) => ({
      step: index + 1,
      description: line.replace(/^(\d+[\.\、]|第?\d+步[:：]?)\s*/, '').trim()
    }))
}

function splitTags(value) {
  return String(value || '')
    .split(/[，,、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function extractNumber(value) {
  const match = String(value || '').match(/\d+/)
  return match ? Number(match[0]) : 0
}

function inferTitleFromUrl(url) {
  if (!url) return ''
  const trimmed = url.trim()
  return trimmed.length > 40 ? '第三方导入菜谱' : trimmed
}

function sourcePlatformLabel(platform) {
  const labels = {
    xiaohongshu: '小红书导入',
    douyin: '抖音导入',
    kuaishou: '快手导入',
    manual: '手动导入'
  }
  return labels[platform] || '导入助手'
}

function formatDraftDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${month}-${day} ${hours}:${minutes}`
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getDefaultImage() {
  const defaultImages = [
    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1563379091339-03246963d0b0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'
  ]

  return defaultImages[Math.floor(Math.random() * defaultImages.length)]
}
