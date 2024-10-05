class DPlayer {
  constructor(options) {
    this.options = handleOption({
      preload: options.video.type === 'webtorrent' ? 'none' : 'metadata',
      ...options,
    })

    if (this.options.video.quality) {
      this.qualityIndex = this.options.video.defaultQuality
      this.quality = this.options.video.quality[this.options.video.defaultQuality]
    }
    this.tran = new i18n(this.options.lang).tran
    this.events = new Events()
    this.user = new User(this)
    this.container = this.options.container
    this.noticeList = {}
  }
}
