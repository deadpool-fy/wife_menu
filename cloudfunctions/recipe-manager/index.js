const cloud = require('wx-server-sdk')
const https = require('https')
const http = require('http')
const PRESET_RECIPES = require('./preset-recipes')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event) => {
  const { action, data = {} } = event

  try {
    switch (action) {
      case 'getAdminAccess':
        return await getAdminAccess()
      case 'addRecipe':
        await assertAdminAccess()
        return await addRecipe(data)
      case 'updateRecipe':
        await assertAdminAccess()
        return await updateRecipe(data)
      case 'deleteRecipe':
        await assertAdminAccess()
        return await deleteRecipe(data)
      case 'getRecipes':
        return await getRecipes(data)
      case 'getRecipeById':
        return await getRecipeById(data)
      case 'getCategories':
        return await getCategories()
      case 'getStats':
        await assertAdminAccess()
        return await getStats()
      case 'getWeatherSnapshot':
        return await getWeatherSnapshot(data)
      case 'createImportDraft':
        await assertAdminAccess()
        return await createImportDraft(data)
      case 'seedPresetRecipes':
        await assertAdminAccess()
        return await seedPresetRecipes(data)
      case 'clearRecipesData':
        await assertAdminAccess()
        return await clearRecipesData()
      case 'clearAllAppData':
        await assertAdminAccess()
        return await clearAllAppData()
      case 'clearCategoriesData':
        await assertAdminAccess()
        return await clearCategoriesData()
      case 'repairPresetRecipeImages':
        await assertAdminAccess()
        return await repairPresetRecipeImages(data)
      case 'enrichRecipeImages':
        await assertAdminAccess()
        return await enrichRecipeImages(data)
      case 'autoImportByUrl':
        await assertAdminAccess()
        return await autoImportByUrl(data)
      case 'getImportDrafts':
        await assertAdminAccess()
        return await getImportDrafts(data)
      case 'runImportDraftOcr':
        await assertAdminAccess()
        return await runImportDraftOcr(data)
      case 'approveImportDraft':
        await assertAdminAccess()
        return await approveImportDraft(data)
      case 'rejectImportDraft':
        await assertAdminAccess()
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
      message: error.message || '服务异常',
      error: error.message || String(error)
    }
  }
}

function normalizeAdminOpenIds(rawValue) {
  if (!rawValue) {
    return []
  }

  return String(rawValue)
    .split(/[\n,;|]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function getCurrentOpenId() {
  const wxContext = cloud.getWXContext()
  return String(wxContext.OPENID || '').trim()
}

function isCurrentUserAdmin() {
  const openId = getCurrentOpenId()
  const adminOpenIds = normalizeAdminOpenIds(process.env.ADMIN_OPENIDS)
  return !!openId && adminOpenIds.includes(openId)
}

async function assertAdminAccess() {
  if (!isCurrentUserAdmin()) {
    throw new Error('当前账号没有后台权限')
  }
}

async function getAdminAccess() {
  const openId = getCurrentOpenId()
  return {
    success: true,
    data: {
      isAdmin: isCurrentUserAdmin(),
      openId
    }
  }
}

async function addRecipe(data) {
  validateRecipePayload(data)

  const duplicate = await db.collection('recipes').where({
    title: String(data.title).trim()
  }).get()

  if (duplicate.data.length > 0) {
    throw new Error('菜谱标题已存在，请更换后再试')
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
    throw new Error('菜谱 ID 不能为空')
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
    'rating',
    'viewCount',
    'likeCount',
    'isFeatured',
    'isActive',
    'sourceUrl',
    'importSource'
  ]

  editableFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      if (field === 'ingredients') {
        updateData.ingredients = normalizeIngredients(data.ingredients)
        return
      }
      if (field === 'steps') {
        updateData.steps = normalizeSteps(data.steps)
        return
      }
      if (field === 'tags') {
        updateData.tags = normalizeTags(data.tags)
        return
      }
      updateData[field] = data[field]
    }
  })

  await db.collection('recipes').doc(data.id).update({ data: updateData })

  return {
    success: true,
    message: '菜谱更新成功'
  }
}

async function deleteRecipe(data) {
  if (!data.id) {
    throw new Error('菜谱 ID 不能为空')
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
    .skip((Math.max(1, Number(page)) - 1) * Number(limit))
    .limit(Number(limit))
    .get()
  const countResult = await (Object.keys(where).length ? collection.where(where) : collection).count()

  return {
    success: true,
    data: {
      recipes: result.data,
      total: countResult.total,
      page: Number(page),
      limit: Number(limit)
    }
  }
}

async function getRecipeById(data) {
  if (!data.id) {
    throw new Error('菜谱 ID 不能为空')
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
  const result = await db.collection('categories').orderBy('sortOrder', 'asc').get()
  return {
    success: true,
    data: result.data
  }
}

async function getStats() {
  const [recipesResult, categoriesResult, recentRecipesResult, pendingImports] = await Promise.all([
    safeCountCollection('recipes'),
    safeCountCollection('categories'),
    db.collection('recipes').orderBy('createdAt', 'desc').limit(5).get().catch(() => ({ data: [] })),
    db.collection('recipe_imports').where({ status: 'pending' }).count().catch(() => ({ total: 0 }))
  ])

  return {
    success: true,
    data: {
      totalRecipes: recipesResult.total,
      totalCategories: categoriesResult.total,
      recentRecipes: recentRecipesResult.data || [],
      featuredRecipes: (recentRecipesResult.data || []).length,
      pendingImports: pendingImports.total || 0
    }
  }
}

async function getWeatherSnapshot(data) {
  const latitude = Number(data.latitude)
  const longitude = Number(data.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('????????')
  }

  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + encodeURIComponent(latitude) + '&longitude=' + encodeURIComponent(longitude) + '&current=temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m,precipitation&timezone=auto&forecast_days=1'
  const responseText = await requestUrl(url, {
    headers: {
      accept: 'application/json'
    },
    timeout: 12000
  })
  const response = JSON.parse(responseText)
  const current = response.current || {}
  console.log('[weather-cloud] request', { latitude, longitude, url })
  console.log('[weather-cloud] response.current', current)

  const temperature = Number(current.temperature_2m)
  const apparentTemperature = Number(current.apparent_temperature)
  const weatherCode = Number(current.weather_code)
  const isDay = Number(current.is_day) === 1
  const windSpeed = Number(current.wind_speed_10m)
  const precipitation = Number(current.precipitation)

  return {
    success: true,
    data: {
      temperature: Number.isFinite(temperature) ? temperature : null,
      apparentTemperature: Number.isFinite(apparentTemperature) ? apparentTemperature : null,
      weatherCode: Number.isFinite(weatherCode) ? weatherCode : 0,
      isDay,
      windSpeed: Number.isFinite(windSpeed) ? windSpeed : 0,
      precipitation: Number.isFinite(precipitation) ? precipitation : 0,
      fetchedAt: new Date().toISOString()
    }
  }
}

async function createImportDraft(data) {
  const sourcePlatform = (data.sourcePlatform || 'manual').trim() || 'manual'
  const sourceUrl = normalizeUrl(data.sourceUrl || '')
  const rawText = String(data.rawText || '').trim()
  const overrideTitle = String(data.title || '').trim()

  if (!sourceUrl && !overrideTitle && !rawText) {
    throw new Error('请至少填写链接、标题或原始内容')
  }

  const parsed = parseImportedRecipe(rawText)
  const title = overrideTitle || parsed.title || inferTitleFromUrl(sourceUrl)

  if (!title) {
    throw new Error('暂时无法识别标题，请补充标题后再试')
  }

  const draft = buildImportDraftRecord({
    sourcePlatform,
    sourceUrl,
    rawText,
    ocrDiagnostics: null,
    parsedRecipe: {
      ...parsed,
      title
    }
  })

  const result = await db.collection('recipe_imports').add({ data: draft })

  return {
    success: true,
    message: '导入草稿已创建，等待审核',
    data: {
      id: result._id,
      draft
    }
  }
}

async function seedPresetRecipes(data) {
  const limit = Math.max(1, Math.min(Number(data.limit) || PRESET_RECIPES.length, PRESET_RECIPES.length))
  const recipes = PRESET_RECIPES.slice(0, limit)
  const titleSet = new Set(recipes.map((item) => String(item.title || '').trim()).filter(Boolean))
  const existingResult = await db.collection('recipes').where({
    title: db.command.in(Array.from(titleSet))
  }).get().catch(() => ({ data: [] }))
  const existingTitles = new Set((existingResult.data || []).map((item) => String(item.title || '').trim()))

  const insertedTitles = []
  const skippedTitles = []

  for (const recipe of recipes) {
    const title = String(recipe.title || '').trim()
    if (!title || existingTitles.has(title)) {
      skippedTitles.push(title)
      continue
    }

    const record = buildRecipeRecord({
      ...recipe,
      author: recipe.author || '系统预设',
      importSource: recipe.importSource || 'preset-batch'
    })

    await db.collection('recipes').add({ data: record })
    insertedTitles.push(title)
    existingTitles.add(title)
  }

  return {
    success: true,
    message: insertedTitles.length ? `已导入 ${insertedTitles.length} 条预设菜谱` : '当前预设菜谱都已存在，未重复导入',
    data: {
      requested: recipes.length,
      inserted: insertedTitles.length,
      skipped: skippedTitles.filter(Boolean).length,
      insertedTitles,
      skippedTitles: skippedTitles.filter(Boolean)
    }
  }
}

async function clearRecipesData() {
  const removed = await clearCollectionRecords('recipes')
  return {
    success: true,
    message: `已清空 recipes 集合，共删除 ${removed} 条记录`,
    data: {
      collections: {
        recipes: removed
      },
      removed
    }
  }
}

async function clearCategoriesData() {
  const removed = await clearCollectionRecords('categories')
  return {
    success: true,
    message: `已清空 categories 集合，共删除 ${removed} 条记录`,
    data: {
      collections: {
        categories: removed
      },
      removed
    }
  }
}

async function clearAllAppData() {
  const collections = ['recipes', 'categories', 'recipe_imports', 'user_favorites', 'user_ratings']
  const summary = {}
  let removed = 0

  for (const collectionName of collections) {
    const count = await clearCollectionRecords(collectionName)
    summary[collectionName] = count
    removed += count
  }

  return {
    success: true,
    message: `已清空全部业务数据，共删除 ${removed} 条记录`,
    data: {
      collections: summary,
      removed
    }
  }
}

async function clearCollectionRecords(collectionName) {
  let removed = 0

  while (true) {
    const batch = await db.collection(collectionName).limit(100).get().catch(() => ({ data: [] }))
    const items = batch.data || []

    if (!items.length) {
      break
    }

    for (const item of items) {
      await db.collection(collectionName).doc(item._id).remove()
      removed += 1
    }
  }

  return removed
}

async function repairPresetRecipeImages(data) {
  const limit = Math.max(1, Math.min(Number(data.limit) || 100, 100))
  const result = await db.collection('recipes').limit(limit).get()
  const recipes = result.data || []
  const updatedTitles = []

  for (const recipe of recipes) {
    const nextImage = normalizeRecipeImage(recipe.image, recipe)
    if (nextImage === String(recipe.image || '').trim()) {
      continue
    }

    await db.collection('recipes').doc(recipe._id).update({
      data: {
        image: nextImage,
        updatedAt: new Date()
      }
    })

    updatedTitles.push(String(recipe.title || '').trim())
  }

  return {
    success: true,
    message: updatedTitles.length ? `已修复 ${updatedTitles.length} 条菜谱封面` : '当前没有需要修复的封面',
    data: {
      scanned: recipes.length,
      updated: updatedTitles.length,
      updatedTitles
    }
  }
}

async function enrichRecipeImages(data) {
  const limit = Math.max(1, Math.min(Number(data.limit) || 30, 30))
  const result = await db.collection('recipes').limit(limit).get()
  const recipes = result.data || []
  const updatedTitles = []
  const skippedTitles = []

  for (const recipe of recipes) {
    const currentImage = String(recipe.image || '').trim()
    const needsImage =
      !currentImage ||
      currentImage === '/images/default-dish.png' ||
      isLegacyDefaultImage(currentImage) ||
      currentImage.includes('source.unsplash.com')

    if (!needsImage) {
      skippedTitles.push(String(recipe.title || '').trim())
      continue
    }

    const imageUrl = buildRecipePhotoUrl(recipe.title, recipe.category)
    if (!imageUrl) {
      skippedTitles.push(String(recipe.title || '').trim())
      continue
    }

    await db.collection('recipes').doc(recipe._id).update({
      data: {
        image: imageUrl,
        updatedAt: new Date()
      }
    })

    updatedTitles.push(String(recipe.title || '').trim())
  }

  return {
    success: true,
    message: updatedTitles.length ? `已补全 ${updatedTitles.length} 条真实菜图` : '这批菜谱暂时没有检索到合适的真实菜图',
    data: {
      scanned: recipes.length,
      updated: updatedTitles.length,
      skipped: skippedTitles.length,
      updatedTitles,
      skippedTitles
    }
  }
}

async function autoImportByUrl(data) {
  const sourceUrl = normalizeUrl(data.sourceUrl || '')
  const sourcePlatform = (data.sourcePlatform || '').trim() || detectPlatformFromUrl(sourceUrl)

  if (!sourceUrl) {
    throw new Error('请先填写第三方链接')
  }

  const fetchedRecipe = await fetchThirdPartyRecipe(sourceUrl, sourcePlatform)
  const rawText = [
    fetchedRecipe.title,
    fetchedRecipe.description,
    fetchedRecipe.bodyText,
    fetchedRecipe.ocrText
  ].filter(Boolean).join('\n')
  const parsedRecipe = mergeImportedRecipe(parseImportedRecipe(rawText), fetchedRecipe)
  const title = parsedRecipe.title || inferTitleFromUrl(sourceUrl)

  if (!title) {
    throw new Error('暂时无法从该链接识别标题，请稍后重试或手动补充')
  }

  const draft = buildImportDraftRecord({
    sourcePlatform,
    sourceUrl,
    rawText,
    sourceImages: fetchedRecipe.sourceImages || [],
    ocrText: fetchedRecipe.ocrText || '',
    ocrDiagnostics: fetchedRecipe.ocrDiagnostics || null,
    parsedRecipe: {
      ...parsedRecipe,
      title
    }
  })

  const result = await db.collection('recipe_imports').add({ data: draft })

  return {
    success: true,
    message: '链接已自动解析并加入待审核队列',
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
    .skip((Math.max(1, Number(page)) - 1) * Number(limit))
    .limit(Number(limit))
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
      page: Number(page),
      limit: Number(limit)
    }
  }
}


async function runImportDraftOcr(data) {
  const { id } = data
  if (!id) {
    throw new Error('草稿 ID 不能为空')
  }

  const draftResult = await db.collection('recipe_imports').doc(id).get()
  const draft = draftResult.data
  if (!draft) {
    throw new Error('导入草稿不存在')
  }

  if (draft.status !== 'pending') {
    throw new Error('仅待审核草稿支持补跑 OCR')
  }

  const sourceImages = Array.isArray(draft.sourceImages) ? draft.sourceImages.filter(Boolean) : []
  if (!sourceImages.length) {
    throw new Error('当前草稿没有可识别的图片')
  }

  const hasProvidedOcr = typeof data.ocrText === 'string' || data.ocrDiagnostics
  const ocrResult = hasProvidedOcr
    ? {
        text: String(data.ocrText || '').trim(),
        diagnostics: data.ocrDiagnostics || null
      }
    : await tryRecognizeImagesByOcr(sourceImages)
  const ocrText = String(ocrResult.text || '').trim()
  const mergedRawText = [draft.originalText, ocrText].filter(Boolean).join('\n')
  const parsedRecipe = mergeImportedRecipe(parseImportedRecipe(mergedRawText), {
    ...draft.parsedRecipe,
    sourceImages,
    ocrText,
    ocrDiagnostics: ocrResult.diagnostics || null,
    image: draft.parsedRecipe?.image || sourceImages[0] || ''
  })

  await db.collection('recipe_imports').doc(id).update({
    data: {
      originalText: mergedRawText || draft.originalText || '',
      ocrText,
      ocrDiagnostics: ocrResult.diagnostics || null,
      parsedRecipe: {
        ...draft.parsedRecipe,
        ...parsedRecipe,
        title: parsedRecipe.title || draft.parsedRecipe?.title || '',
        description: parsedRecipe.description || draft.parsedRecipe?.description || '',
        image: parsedRecipe.image || draft.parsedRecipe?.image || sourceImages[0] || '',
        category: parsedRecipe.category || draft.parsedRecipe?.category || '家常菜',
        difficulty: parsedRecipe.difficulty || draft.parsedRecipe?.difficulty || '简单',
        cookingTime: parsedRecipe.cookingTime || draft.parsedRecipe?.cookingTime || '30分钟',
        servings: parsedRecipe.servings || draft.parsedRecipe?.servings || 2,
        calories: parsedRecipe.calories || draft.parsedRecipe?.calories || 200,
        ingredients: normalizeIngredients(parsedRecipe.ingredients),
        steps: normalizeSteps(parsedRecipe.steps),
        tags: normalizeTags(parsedRecipe.tags),
        author: parsedRecipe.author || draft.parsedRecipe?.author || sourcePlatformLabel(draft.sourcePlatform),
        sourceUrl: draft.sourceUrl || draft.parsedRecipe?.sourceUrl || ''
      },
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    message: ocrText ? 'OCR 已完成并更新草稿' : 'OCR 已执行，但暂未识别出图片文字',
    data: {
      id,
      ocrText,
      ocrDiagnostics: ocrResult.diagnostics || null
    }
  }
}

async function approveImportDraft(data) {
  const { id, reviewNote = '' } = data
  if (!id) {
    throw new Error('草稿 ID 不能为空')
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
  const addResult = await db.collection('recipes').add({ data: recipe })

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
    message: '草稿已通过审核并入库',
    data: {
      recipeId: addResult._id
    }
  }
}

async function rejectImportDraft(data) {
  const { id, reviewNote = '' } = data
  if (!id) {
    throw new Error('草稿 ID 不能为空')
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
  if (!String(data.title || '').trim()) {
    throw new Error('标题为必填项')
  }
  if (!String(data.description || '').trim()) {
    throw new Error('描述为必填项')
  }
  if (!String(data.category || '').trim()) {
    throw new Error('分类为必填项')
  }
  if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) {
    throw new Error('至少需要一项食材')
  }
  if (!Array.isArray(data.steps) || data.steps.length === 0) {
    throw new Error('至少需要一个步骤')
  }
}

function buildRecipeRecord(data) {
  return {
    title: String(data.title).trim(),
    description: String(data.description).trim(),
    image: normalizeRecipeImage(data.image, data),
    category: data.category || '家常菜',
    difficulty: data.difficulty || '简单',
    cookingTime: data.cookingTime || '30分钟',
    servings: Number(data.servings) || 2,
    calories: Number(data.calories) || 200,
    ingredients: normalizeIngredients(data.ingredients),
    steps: normalizeSteps(data.steps),
    tips: String(data.tips || '').trim(),
    author: String(data.author || '导入助手').trim(),
    tags: normalizeTags(data.tags),
    rating: Number(data.rating) || 0,
    viewCount: Number(data.viewCount) || 0,
    likeCount: Number(data.likeCount) || 0,
    isFeatured: typeof data.isFeatured === 'boolean' ? data.isFeatured : false,
    isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
    sourceUrl: data.sourceUrl || '',
    importSource: data.importSource || null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function normalizeRecipeImage(image, data = {}) {
  const value = String(image || '').trim()
  if (value && !isLegacyDefaultImage(value) && value !== '/images/default-dish.png') {
    return value
  }

  return buildRecipePhotoUrl(data.title, data.category)
}

function buildImportDraftRecord({ sourcePlatform, sourceUrl, rawText, sourceImages = [], ocrText = '', ocrDiagnostics = null, parsedRecipe }) {
  return {
    status: 'pending',
    sourcePlatform,
    sourceUrl,
    originalText: rawText,
    sourceImages,
    ocrText,
    ocrDiagnostics,
    parsedRecipe: {
      title: parsedRecipe.title,
      description: parsedRecipe.description || '待审核导入草稿，请补充更完整的简介。',
      image: parsedRecipe.image || parsedRecipe.imageUrl || '',
      category: parsedRecipe.category || '家常菜',
      difficulty: parsedRecipe.difficulty || '简单',
      cookingTime: parsedRecipe.cookingTime || '30分钟',
      servings: parsedRecipe.servings || 2,
      calories: parsedRecipe.calories || 200,
      ingredients: normalizeIngredients(parsedRecipe.ingredients),
      steps: normalizeSteps(parsedRecipe.steps),
      tips: parsedRecipe.tips || '',
      tags: normalizeTags(parsedRecipe.tags),
      author: parsedRecipe.author || sourcePlatformLabel(sourcePlatform),
      sourceUrl
    },
    reviewNote: '',
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function normalizeIngredients(ingredients = []) {
  return (ingredients || [])
    .filter((item) => item && String(item.name || '').trim())
    .map((item) => ({
      name: String(item.name).trim(),
      amount: String(item.amount || '适量').trim()
    }))
}

function normalizeSteps(steps = []) {
  return (steps || [])
    .filter((item) => item && String(item.description || '').trim())
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

async function safeCountCollection(name) {
  try {
    return await db.collection(name).count()
  } catch (error) {
    return { total: 0 }
  }
}

function parseImportedRecipe(rawText) {
  const text = String(rawText || '').replace(/\r/g, '').trim()
  if (!text) {
    return emptyParsedRecipe()
  }

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  const parsed = emptyParsedRecipe()
  let currentSection = ''

  lines.forEach((line, index) => {
    if (!parsed.title && index === 0 && line.length <= 40 && !/^https?:\/\//i.test(line)) {
      parsed.title = cleanText(line)
      return
    }

    const section = detectSection(line)
    if (section) {
      currentSection = section.name
      if (section.value) {
        appendSectionValue(parsed, currentSection, section.value)
      }
      return
    }

    if (currentSection) {
      appendSectionValue(parsed, currentSection, line)
      return
    }

    if (!parsed.description && line.length > 10 && !/^https?:\/\//i.test(line)) {
      parsed.description = cleanText(line)
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

function emptyParsedRecipe() {
  return {
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
}

function detectSection(line) {
  const match = line.match(/^([^:：]{1,12})[:：]\s*(.*)$/)
  if (!match) return null

  const key = match[1].trim()
  const value = match[2].trim()
  const map = {
    ingredients: ['食材', '配料', '用料'],
    steps: ['步骤', '做法', '制作步骤'],
    tips: ['小贴士', '技巧', '备注'],
    tags: ['标签', '关键词'],
    description: ['简介', '描述'],
    title: ['标题', '菜名'],
    category: ['分类'],
    difficulty: ['难度'],
    cookingTime: ['时间', '烹饪时间', '制作时间'],
    servings: ['人数', '份量', '适合人数'],
    calories: ['热量', '卡路里'],
    author: ['作者', '来源'],
    image: ['图片', '封面']
  }

  for (const [name, aliases] of Object.entries(map)) {
    if (aliases.some((alias) => key.includes(alias))) {
      return { name, value }
    }
  }

  return null
}

function appendSectionValue(parsed, section, value) {
  if (!value) return
  switch (section) {
    case 'title':
      parsed.title = cleanText(value)
      break
    case 'category':
      parsed.category = cleanText(value)
      break
    case 'difficulty':
      parsed.difficulty = cleanText(value)
      break
    case 'cookingTime':
      parsed.cookingTime = cleanText(value)
      break
    case 'servings':
      parsed.servings = extractNumber(value) || parsed.servings
      break
    case 'calories':
      parsed.calories = extractNumber(value) || parsed.calories
      break
    case 'author':
      parsed.author = cleanText(value)
      break
    case 'image':
      parsed.image = cleanText(value)
      break
    case 'description':
      parsed.description = parsed.description ? `${parsed.description}\n${cleanText(value)}` : cleanText(value)
      break
    case 'ingredients':
      pushIngredient(parsed.ingredients, value)
      break
    case 'steps':
      pushStep(parsed.steps, value)
      break
    case 'tips':
      parsed.tips = parsed.tips ? `${parsed.tips}\n${cleanText(value)}` : cleanText(value)
      break
    case 'tags':
      parsed.tags = [...parsed.tags, ...splitTags(value)]
      break
    default:
      break
  }
}

function pushIngredient(list, line) {
  const cleaned = String(line || '').replace(/^[\-\*\d\.\s]+/, '').trim()
  if (!cleaned) return
  const match = cleaned.match(/^(.+?)[\s:：]+(.+)$/)
  if (match) {
    list.push({ name: match[1].trim(), amount: match[2].trim() })
    return
  }
  list.push({ name: cleaned, amount: '适量' })
}

function pushStep(list, line) {
  const cleaned = String(line || '').replace(/^(第\s*\d+\s*步|\d+[\.、:\-]?)/, '').trim()
  if (!cleaned) return
  list.push({
    step: list.length + 1,
    description: cleanText(cleaned)
  })
}

function extractLooseIngredients(lines) {
  return lines
    .filter((line) => /克|勺|个|片|根|ml|适量|少许|公斤|千克|茶匙|汤匙/.test(line))
    .slice(0, 12)
    .map((line) => {
      const match = line.match(/^(.+?)[\s:：]+(.+)$/)
      return match
        ? { name: match[1].trim(), amount: match[2].trim() }
        : { name: cleanText(line), amount: '适量' }
    })
}

function extractLooseSteps(lines) {
  return lines
    .filter((line) => /^(第\s*\d+\s*步|\d+[\.、])/.test(line))
    .map((line, index) => ({
      step: index + 1,
      description: cleanText(line.replace(/^(第\s*\d+\s*步|\d+[\.、:\-]?)/, '').trim())
    }))
}

async function fetchThirdPartyRecipe(sourceUrl, sourcePlatform) {
  const externalResult = await tryFetchFromExternalCrawler(sourceUrl, sourcePlatform)
  if (externalResult) {
    return externalResult
  }

  const html = await fetchPageHtml(sourceUrl)
  const metadata = extractRecipeMetadataFromHtml(html, sourceUrl)
  const shouldRunSyncOcr = String(process.env.IMPORT_OCR_SYNC || '').toLowerCase() === 'true'
  const ocrResult = shouldRunSyncOcr
    ? await tryRecognizeImagesByOcr(metadata.sourceImages || [])
    : {
        text: '',
        diagnostics: {
          status: 'ocr_deferred'
        }
      }
  const ocrText = ocrResult.text || ''

  if (!metadata.title && !metadata.description && !metadata.bodyText && !ocrText) {
    throw new Error('当前链接暂时无法自动解析，建议稍后换链接重试')
  }

  return {
    ...metadata,
    sourceUrl,
    sourceImages: metadata.sourceImages || [],
    ocrText,
    ocrDiagnostics: ocrResult.diagnostics || null,
    author: metadata.author || sourcePlatformLabel(sourcePlatform),
    category: metadata.category || inferCategoryFromText(metadata.title, metadata.description, metadata.bodyText),
    difficulty: metadata.difficulty || inferDifficultyFromText(metadata.title, metadata.description, metadata.bodyText),
    cookingTime: metadata.cookingTime || inferCookingTimeFromText(metadata.title, metadata.description, metadata.bodyText),
    servings: metadata.servings || inferServingsFromText(metadata.title, metadata.description, metadata.bodyText),
    calories: metadata.calories || 0,
    ingredients: metadata.ingredients || [],
    steps: metadata.steps || [],
    tips: metadata.tips || '',
    tags: metadata.tags || []
  }
}

async function tryFetchFromExternalCrawler(sourceUrl, sourcePlatform) {
  const baseUrl = process.env.IMPORT_CRAWLER_BASE_URL
  if (!baseUrl) {
    return null
  }

  try {
    const crawlerUrl = `${baseUrl.replace(/\/$/, '')}/extract?url=${encodeURIComponent(sourceUrl)}&platform=${encodeURIComponent(sourcePlatform)}`
    const responseText = await requestUrl(crawlerUrl)
    const response = JSON.parse(responseText)
    if (!response || !response.success || !response.data) {
      return null
    }
    return response.data
  } catch (error) {
    console.warn('external crawler unavailable:', error.message)
    return null
  }
}

async function tryRecognizeImagesByOcr(sourceImages) {
  const images = (sourceImages || []).filter(Boolean).slice(0, 9)
  if (!images.length) {
    return {
      text: '',
      diagnostics: {
        status: 'no_images'
      }
    }
  }

  const baseUrl = process.env.IMPORT_OCR_BASE_URL || 'https://wife-menu-ocr-239718-10-1380957963.sh.run.tcloudbase.com/api'
  if (!baseUrl) {
    return {
      text: '',
      diagnostics: {
        status: 'ocr_service_not_configured'
      }
    }
  }

  try {
    const responseText = await requestJson(
      `${baseUrl.replace(/\/$/, '')}/ocr/images`,
      {
        images
      }
    )
    const response = JSON.parse(responseText)
    if (!response || !response.success) {
      return {
        text: '',
        diagnostics: {
          status: 'ocr_service_returned_error'
        }
      }
    }

    return {
      text: String(response.text || response.data?.text || '').trim(),
      diagnostics: {
        status: 'ok',
        requestedCount: images.length,
        recognizedCount: Number(response.diagnostics?.recognizedCount || 0),
        emptyCount: Number(response.diagnostics?.emptyCount || 0),
        failedCount: Number(response.diagnostics?.failedCount || 0),
        results: Array.isArray(response.data?.results) ? response.data.results : []
      }
    }
  } catch (error) {
    console.warn('ocr service unavailable:', error.message)
    return {
      text: '',
      diagnostics: {
        status: 'ocr_service_unavailable',
        message: error.message
      }
    }
  }
}

async function fetchPageHtml(sourceUrl) {
  const html = await requestUrl(sourceUrl, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
    }
  })

  return String(html || '')
}

function requestJson(targetUrl, payload) {
  const client = targetUrl.startsWith('https') ? https : http
  const body = JSON.stringify(payload || {})
  const parsed = new URL(targetUrl)

  return new Promise((resolve, reject) => {
    const req = client.request({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      path: `${parsed.pathname}${parsed.search}`,
      method: 'POST',
      timeout: 18000,
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body)
      }
    }, (res) => {
      const statusCode = res.statusCode || 0
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        if (statusCode >= 400) {
          reject(new Error(`request failed with status ${statusCode}`))
          return
        }
        resolve(Buffer.concat(chunks).toString('utf8'))
      })
    })

    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('request timeout')))
    req.write(body)
    req.end()
  })
}

function requestUrl(targetUrl, options = {}, redirectCount = 0) {
  const client = targetUrl.startsWith('https') ? https : http

  return new Promise((resolve, reject) => {
    const req = client.request(targetUrl, {
      method: 'GET',
      timeout: 12000,
      ...options
    }, (res) => {
      const statusCode = res.statusCode || 0
      const location = res.headers.location

      if ([301, 302, 303, 307, 308].includes(statusCode) && location && redirectCount < 5) {
        const nextUrl = new URL(location, targetUrl).toString()
        res.resume()
        resolve(requestUrl(nextUrl, options, redirectCount + 1))
        return
      }

      if (statusCode >= 400) {
        res.resume()
        reject(new Error(`request failed with status ${statusCode}`))
        return
      }

      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve(buffer.toString('utf8'))
      })
    })

    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('request timeout')))
    req.end()
  })
}

async function fetchRecipeImageFromCommons(title, category) {
  const queries = buildCommonsQueries(title, category)

  for (const query of queries) {
    const targetUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json`
    let responseText = ''

    try {
      responseText = await withHardTimeout(
        requestUrl(targetUrl, { timeout: 3500 }),
        4000,
        'commons search timeout'
      )
    } catch (error) {
      continue
    }

    let payload = {}

    try {
      payload = JSON.parse(responseText)
    } catch (error) {
      payload = {}
    }

    const pages = Object.values((payload.query && payload.query.pages) || {})
    const scored = pages
      .map((page) => scoreCommonsPage(page, title, category))
      .filter((item) => item.url)
      .sort((a, b) => b.score - a.score)

    if (scored.length > 0) {
      return scored[0].url
    }
  }

  return ''
}

function buildCommonsQueries(title, category) {
  const cleanTitle = String(title || '').trim()
  const titleTokens = cleanTitle.split(/[\s·/]+/).filter(Boolean)
  const categoryKeywords = {
    '荤菜': 'food dish',
    '素菜': 'vegetable dish',
    '荤素搭配': 'cooked dish',
    '汤类': 'soup food',
    '汤品': 'soup food',
    '甜品': 'dessert food',
    '主食': 'rice noodles food',
    '凉菜': 'cold dish food',
    '饮品': 'drink beverage'
  }
  const suffix = categoryKeywords[String(category || '').trim()] || 'food'
  const queries = [
    `${cleanTitle} ${suffix}`
  ]

  return Array.from(new Set(queries.map((item) => item.trim()).filter(Boolean)))
}

function withHardTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message || 'timeout')), timeoutMs)
    })
  ])
}

function scoreCommonsPage(page, title, category) {
  const info = Array.isArray(page && page.imageinfo) ? page.imageinfo[0] : null
  const url = info ? (info.thumburl || info.url || '') : ''
  const pageTitle = String(page && page.title || '').toLowerCase()
  const queryTitle = String(title || '').toLowerCase()
  const categoryText = String(category || '').toLowerCase()
  let score = 0

  if (pageTitle.includes(queryTitle)) score += 8
  if (pageTitle.includes('food') || pageTitle.includes('dish')) score += 3
  if (categoryText && pageTitle.includes(categoryText)) score += 1
  if (/\.(jpg|jpeg|png|webp)$/i.test(url)) score += 1

  return {
    score,
    url
  }
}

function buildRecipePhotoUrl(title, category) {
  const value = String(title || '').trim()
  const categoryText = String(category || '').trim()

  if (/红烧|糖醋|回锅|扣肉|排骨|里脊|酱牛肉/.test(value)) {
    return 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80'
  }
  if (/麻婆豆腐|豆腐/.test(value)) {
    return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=900&q=80'
  }
  if (/番茄|西红柿|鸡蛋|地三鲜|豆角|包菜|西兰花|莴笋|南瓜|茄子|秋葵|百合|白菜/.test(value)) {
    return 'https://images.unsplash.com/photo-1563379091339-03246963d0b0?auto=format&fit=crop&w=900&q=80'
  }
  if (/汤|羹|露|糊/.test(value) || categoryText === '汤品') {
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80'
  }
  if (/甜|奶|冻|圆子|红豆|雪梨|银耳|酸奶|西米/.test(value) || categoryText === '甜品') {
    return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80'
  }
  if (/鸡|鸭|牛|羊|虾|鱼/.test(value) || categoryText === '荤菜' || categoryText === '搭配') {
    return 'https://images.unsplash.com/photo-1563379091339-03246963d0b0?auto=format&fit=crop&w=900&q=80'
  }
  if (categoryText === '素菜') {
    return 'https://images.unsplash.com/photo-1563379091339-03246963d0b0?auto=format&fit=crop&w=900&q=80'
  }

  return 'https://images.unsplash.com/photo-1563379091339-03246963d0b0?auto=format&fit=crop&w=900&q=80'
}

function inferPhotoKeywords(title, category) {
  return inferPhotoKeywordsSafe(title, category)
}

function inferPhotoKeywordsSafe(title, category) {
  const value = String(title || '').trim()
  const categoryText = String(category || '').trim()
  const keywords = ['chinese food']

  if (/[\u9e21]/.test(value)) keywords.push('chicken')
  if (/[\u725b]/.test(value)) keywords.push('beef')
  if (/[\u732a]|\u6392\u9aa8|\u91cc\u810a|\u8089\u672b|\u8089\u4e1d|\u8089\u7247/.test(value)) keywords.push('pork')
  if (/[\u867e]/.test(value)) keywords.push('shrimp')
  if (/[\u9c7c]/.test(value)) keywords.push('fish')
  if (/[\u86cb]/.test(value)) keywords.push('egg')
  if (/\u8c46\u8150/.test(value)) keywords.push('tofu')
  if (/\u756a\u8304|\u897f\u7ea2\u67ff/.test(value)) keywords.push('tomato')
  if (/\u571f\u8c46/.test(value)) keywords.push('potato')
  if (/[\u9762\u7c89]/.test(value)) keywords.push('noodles')
  if (/[\u996d]/.test(value)) keywords.push('rice')
  if (/[\u6c64]/.test(value) || /\u6c64\u7c7b|\u6c64\u54c1/.test(categoryText)) keywords.push('soup')
  if (/[\u751c\u7fb9\u5976\u9732]/.test(value) || /\u751c\u54c1/.test(categoryText)) keywords.push('dessert')
  if (/[\u8336\u5976\u6c41]/.test(value) || /\u996e\u54c1/.test(categoryText)) keywords.push('drink')
  if (/\u7d20\u83dc/.test(categoryText)) keywords.push('vegetable')

  return Array.from(new Set(keywords)).slice(0, 4)
}

function extractRecipeMetadataFromHtml(html, sourceUrl) {
  const normalizedHtml = String(html || '')
  const title = firstNonEmpty([
    extractMetaContent(normalizedHtml, 'property', 'og:title'),
    extractMetaContent(normalizedHtml, 'name', 'twitter:title'),
    extractJsonLdField(normalizedHtml, 'name'),
    extractTitleTag(normalizedHtml)
  ])
  const description = firstNonEmpty([
    extractMetaContent(normalizedHtml, 'property', 'og:description'),
    extractMetaContent(normalizedHtml, 'name', 'description'),
    extractMetaContent(normalizedHtml, 'name', 'twitter:description'),
    extractJsonLdField(normalizedHtml, 'description')
  ])
  const image = firstNonEmpty([
    extractMetaContent(normalizedHtml, 'property', 'og:image'),
    extractMetaContent(normalizedHtml, 'name', 'twitter:image'),
    extractJsonLdField(normalizedHtml, 'image')
  ])
  const sourceImages = extractImageUrlsFromHtml(normalizedHtml, sourceUrl)
  const author = firstNonEmpty([
    extractMetaContent(normalizedHtml, 'name', 'author'),
    extractJsonLdField(normalizedHtml, 'author')
  ])
  const bodyText = extractBodyText(normalizedHtml)
  const ingredients = extractRecipeListFromJsonLd(normalizedHtml, 'recipeIngredient').map((item) => ({
    name: cleanText(item),
    amount: '适量'
  }))
  const steps = extractRecipeListFromJsonLd(normalizedHtml, 'recipeInstructions').map((item, index) => ({
    step: index + 1,
    description: cleanText(typeof item === 'string' ? item : item.text || item.name || '')
  })).filter((item) => item.description)
  const tags = normalizeTags([
    ...splitTags(extractMetaContent(normalizedHtml, 'name', 'keywords')),
    ...extractHashtags(`${title} ${description} ${bodyText}`)
  ])

  return {
    title: sanitizeImportedTitle(cleanText(title)),
    description: cleanText(description),
    image: normalizeAssetUrl(image, sourceUrl),
    sourceImages,
    bodyText: cleanBodyText(bodyText),
    author: cleanText(author),
    ingredients,
    steps,
    tags
  }
}

function extractImageUrlsFromHtml(html, sourceUrl) {
  const urls = []
  const pushUrl = (value) => {
    const normalized = normalizeAssetUrl(value, sourceUrl)
    if (!normalized) return
    if (/\.svg(\?|$)/i.test(normalized)) return
    if (!urls.includes(normalized)) {
      urls.push(normalized)
    }
  }

  const imageMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)
  for (const match of imageMatches) {
    pushUrl(match[1])
  }

  const ogImages = html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/gi)
  for (const match of ogImages) {
    pushUrl(match[1])
  }

  const jsonImages = extractRecipeListFromJsonLd(html, 'image')
  jsonImages.forEach((item) => {
    if (typeof item === 'string') {
      pushUrl(item)
      return
    }
    if (item && typeof item === 'object') {
      pushUrl(item.url || item.contentUrl || item.thumbnail)
    }
  })

  return urls.slice(0, 12)
}

function extractMetaContent(html, attrName, attrValue) {
  const pattern = new RegExp(`<meta[^>]*${attrName}=["']${escapeRegExp(attrValue)}["'][^>]*content=["']([^"']+)["'][^>]*>|<meta[^>]*content=["']([^"']+)["'][^>]*${attrName}=["']${escapeRegExp(attrValue)}["'][^>]*>`, 'i')
  const match = html.match(pattern)
  return decodeHtmlEntities(match ? (match[1] || match[2] || '') : '')
}

function extractTitleTag(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return decodeHtmlEntities(match ? match[1] : '')
}

function extractJsonLdField(html, field) {
  const blocks = extractJsonLdBlocks(html)
  for (const block of blocks) {
    const value = findJsonLdField(block, field)
    if (Array.isArray(value)) {
      const first = value.find(Boolean)
      if (first) return typeof first === 'string' ? first : JSON.stringify(first)
    }
    if (value && typeof value === 'object') {
      return value.name || value.text || ''
    }
    if (value) {
      return String(value)
    }
  }
  return ''
}

function extractRecipeListFromJsonLd(html, field) {
  const blocks = extractJsonLdBlocks(html)
  for (const block of blocks) {
    const value = findJsonLdField(block, field)
    if (Array.isArray(value) && value.length) {
      return value
    }
  }
  return []
}

function extractJsonLdBlocks(html) {
  const matches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  return matches.map((match) => {
    try {
      return JSON.parse(decodeHtmlEntities(match[1].trim()))
    } catch (error) {
      return null
    }
  }).filter(Boolean)
}

function findJsonLdField(input, field) {
  if (!input) return null
  if (Array.isArray(input)) {
    for (const item of input) {
      const found = findJsonLdField(item, field)
      if (found) return found
    }
    return null
  }
  if (typeof input !== 'object') return null
  if (Object.prototype.hasOwnProperty.call(input, field)) return input[field]
  if (input['@graph']) {
    const found = findJsonLdField(input['@graph'], field)
    if (found) return found
  }
  for (const value of Object.values(input)) {
    const found = findJsonLdField(value, field)
    if (found) return found
  }
  return null
}

function extractBodyText(html) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
}

function cleanBodyText(text) {
  const body = decodeHtmlEntities(String(text || ''))
    .replace(/\r/g, '')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()

  return body
    .split('\n')
    .map((line) => cleanText(line))
    .filter((line) => line && line.length <= 140)
    .slice(0, 24)
    .join('\n')
}

function cleanText(text) {
  return decodeHtmlEntities(String(text || ''))
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001F]/g, '')
    .trim()
}

function sanitizeImportedTitle(title) {
  const normalized = String(title || '').replace(/\s+/g, ' ').trim()
  const compact = normalized.replace(/[\uFF5C\u4E28]/g, '|')
  const parts = compact.split(/\s*[-|]\s*/)
  const suffix = parts.length > 1 ? String(parts[parts.length - 1] || '').toLowerCase() : ''
  const platformKeywords = ['\u5c0f\u7ea2\u4e66', '\u6296\u97f3', '\u5feb\u624b', '\u5fae\u535a', '\u77e5\u4e4e', '\u54d4\u54e9\u54d4\u54e9', 'bilibili', '\u817e\u8baf\u89c6\u9891', '\u4f18\u9177', '\u5b98\u7f51', '\u7f51\u9875']

  if (suffix && platformKeywords.some((keyword) => suffix.includes(String(keyword).toLowerCase()))) {
    return parts.slice(0, -1).join(' - ').trim()
  }

  return normalized
}

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function normalizeAssetUrl(url, sourceUrl) {
  const value = String(url || '').trim()
  if (!value) return ''
  try {
    return new URL(value, sourceUrl).toString()
  } catch (error) {
    return value
  }
}

function extractHashtags(text) {
  return String(text || '').match(/#[^#\s]{1,20}/g) || []
}

function inferCategoryFromText(...texts) {
  const merged = texts.join(' ')
  if (/汤|炖|羹/.test(merged)) return '汤类'
  if (/甜品|蛋糕|布丁|面包|饼/.test(merged)) return '甜品'
  if (/沙拉|素|蔬菜/.test(merged)) return '素菜'
  if (/鸡|鸭|鱼|虾|牛|猪|排骨/.test(merged)) return '荤菜'
  return '家常菜'
}

function inferDifficultyFromText(...texts) {
  const merged = texts.join(' ')
  if (/快手|新手|简单|零失败/.test(merged)) return '简单'
  if (/宴客|复杂|进阶/.test(merged)) return '困难'
  return '中等'
}

function inferCookingTimeFromText(...texts) {
  const merged = texts.join(' ')
  const minuteMatch = merged.match(/(\d{1,3})\s*分钟/)
  if (minuteMatch) return `${minuteMatch[1]}分钟`
  if (/快手|十分钟|15分钟/.test(merged)) return '15分钟'
  if (/炖|焖|烤/.test(merged)) return '45分钟'
  return '30分钟'
}

function inferServingsFromText(...texts) {
  const merged = texts.join(' ')
  const match = merged.match(/(\d)人份|适合(\d)人|供(\d)人/)
  const value = match && match.slice(1).find(Boolean)
  return value ? Number(value) : 2
}

function detectPlatformFromUrl(url) {
  if (/xiaohongshu\.com|xhslink\.com/i.test(url)) return 'xiaohongshu'
  if (/douyin\.com|iesdouyin\.com/i.test(url)) return 'douyin'
  if (/kuaishou\.com/i.test(url)) return 'kuaishou'
  return 'manual'
}

function normalizeUrl(value) {
  const input = String(value || '').trim()
  if (!input) return ''
  if (/^https?:\/\//i.test(input)) return input
  return `https://${input}`
}

function mergeImportedRecipe(parsedRecipe, fetchedRecipe) {
  return {
    ...parsedRecipe,
    title: fetchedRecipe.title || parsedRecipe.title,
    description: fetchedRecipe.description || parsedRecipe.description,
    image: fetchedRecipe.image || fetchedRecipe.imageUrl || parsedRecipe.image,
    category: fetchedRecipe.category || parsedRecipe.category,
    difficulty: fetchedRecipe.difficulty || parsedRecipe.difficulty,
    cookingTime: fetchedRecipe.cookingTime || parsedRecipe.cookingTime,
    servings: fetchedRecipe.servings || parsedRecipe.servings,
    calories: fetchedRecipe.calories || parsedRecipe.calories,
    ingredients: fetchedRecipe.ingredients && fetchedRecipe.ingredients.length ? fetchedRecipe.ingredients : parsedRecipe.ingredients,
    steps: fetchedRecipe.steps && fetchedRecipe.steps.length ? fetchedRecipe.steps : parsedRecipe.steps,
    tips: fetchedRecipe.tips || parsedRecipe.tips,
    tags: normalizeTags([...(parsedRecipe.tags || []), ...(fetchedRecipe.tags || [])]),
    author: fetchedRecipe.author || parsedRecipe.author
  }
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
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname.replace(/^\/+|\/+$/g, '')
    if (!pathname) return '第三方导入菜谱'
    return pathname.length > 36 ? '第三方导入菜谱' : pathname
  } catch (error) {
    return '第三方导入菜谱'
  }
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

function firstNonEmpty(values) {
  return values.find((value) => String(value || '').trim()) || ''
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getLegacyDefaultImages() {
  return [
    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1563379091339-03246963d0b0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'
  ]
}

function isLegacyDefaultImage(image) {
  return getLegacyDefaultImages().includes(String(image || '').trim())
}

function getCoverPalette(category) {
  const palettes = {
    '荤菜': ['c45b3b', 'fffaf4'],
    '素菜': ['6f9860', 'fffaf4'],
    '荤素搭配': ['bd8046', 'fffaf4'],
    '汤类': ['caa06c', '214033'],
    '汤品': ['caa06c', '214033'],
    '甜品': ['b57977', 'fffaf4'],
    '主食': ['aa6e45', 'fffaf4'],
    '凉菜': ['6c8b84', 'fffaf4'],
    '饮品': ['6f8fa0', 'fffaf4']
  }

  return palettes[String(category || '').trim()] || ['a65f3d', 'fffaf4']
}

function buildRecipeCoverUrl(title, category) {
  const [background, foreground] = getCoverPalette(category)
  const text = encodeURIComponent(String(title || '今日好味').trim() || '今日好味')
  return `https://dummyimage.com/720x540/${background}/${foreground}.png&text=${text}`
}
