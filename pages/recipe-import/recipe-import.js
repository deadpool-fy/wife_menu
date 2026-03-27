const cloudApiService = require('../../utils/cloudApi.js')

Page({
  data: {
    sourcePlatforms: [
      { label: '手动整理', value: 'manual' },
      { label: '小红书', value: 'xiaohongshu' },
      { label: '抖音', value: 'douyin' },
      { label: '快手', value: 'kuaishou' }
    ],
    sourcePlatformIndex: 0,
    sourceUrl: '',
    sourceTitle: '',
    rawText: '',
    drafts: [],
    loadingDrafts: false,
    submitting: false,
    reviewNote: ''
  },

  onLoad() {
    this.loadDrafts()
  },

  onShow() {
    this.loadDrafts()
  },

  onPlatformChange(e) {
    this.setData({
      sourcePlatformIndex: Number(e.detail.value)
    })
  },

  onUrlInput(e) {
    this.setData({
      sourceUrl: e.detail.value
    })
  },

  onTitleInput(e) {
    this.setData({
      sourceTitle: e.detail.value
    })
  },

  onRawTextInput(e) {
    this.setData({
      rawText: e.detail.value
    })
  },

  async submitImport() {
    if (!this.data.sourceUrl.trim() && !this.data.sourceTitle.trim() && !this.data.rawText.trim()) {
      wx.showToast({
        title: '请至少填写链接、标题或原始内容',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })

    try {
      const currentPlatform = this.data.sourcePlatforms[this.data.sourcePlatformIndex]
      const result = await cloudApiService.createImportDraft({
        sourcePlatform: currentPlatform.value,
        sourceUrl: this.data.sourceUrl.trim(),
        title: this.data.sourceTitle.trim(),
        rawText: this.data.rawText.trim()
      })

      if (!result.success) {
        throw new Error(result.message || '导入失败')
      }

      wx.showToast({
        title: '已进入待审核',
        icon: 'success'
      })

      this.setData({
        sourceUrl: '',
        sourceTitle: '',
        rawText: ''
      })

      await this.loadDrafts()
    } catch (error) {
      wx.showToast({
        title: error.message || '导入失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  async loadDrafts() {
    this.setData({ loadingDrafts: true })

    try {
      const result = await cloudApiService.getImportDrafts({
        status: 'pending',
        limit: 20
      })

      if (!result.success) {
        throw new Error(result.message || '获取草稿失败')
      }

      this.setData({
        drafts: result.data.drafts || []
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '草稿加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loadingDrafts: false })
    }
  },

  async approveDraft(e) {
    const { id } = e.currentTarget.dataset

    try {
      wx.showLoading({ title: '入库中...' })
      const result = await cloudApiService.approveImportDraft({
        id,
        reviewNote: '后台审核通过'
      })
      wx.hideLoading()

      if (!result.success) {
        throw new Error(result.message || '审核失败')
      }

      wx.showToast({
        title: '已入库',
        icon: 'success'
      })

      await this.loadDrafts()
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '审核失败',
        icon: 'none'
      })
    }
  },

  rejectDraft(e) {
    const { id } = e.currentTarget.dataset

    wx.showModal({
      title: '驳回导入草稿',
      content: '确认驳回这条草稿吗？驳回后不会进入正式菜谱库。',
      confirmColor: '#bf5638',
      success: async (res) => {
        if (!res.confirm) {
          return
        }

        try {
          const result = await cloudApiService.rejectImportDraft({
            id,
            reviewNote: '后台审核驳回'
          })

          if (!result.success) {
            throw new Error(result.message || '驳回失败')
          }

          wx.showToast({
            title: '已驳回',
            icon: 'success'
          })

          await this.loadDrafts()
        } catch (error) {
          wx.showToast({
            title: error.message || '驳回失败',
            icon: 'none'
          })
        }
      }
    })
  },

  copyDraftText(e) {
    const { text } = e.currentTarget.dataset
    wx.setClipboardData({
      data: text || '',
      success: () => {
        wx.showToast({
          title: '内容已复制',
          icon: 'success'
        })
      }
    })
  }
})
