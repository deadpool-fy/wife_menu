Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: 'pages/index/index',
        text: '今晚吃什么',
        subtext: 'Dinner',
        iconType: 'menu'
      },
      {
        pagePath: 'pages/category/category',
        text: '找点灵感',
        subtext: 'Browse',
        iconType: 'grid'
      }
    ]
  },

  methods: {
    setSelected(selected) {
      if (selected === this.data.selected) {
        return
      }

      this.setData({ selected })
    },

    switchTab(e) {
      const index = Number(e.currentTarget.dataset.index)
      const path = e.currentTarget.dataset.path

      if (index === this.data.selected) {
        return
      }

      wx.switchTab({
        url: `/${path}`
      })
    }
  }
})
