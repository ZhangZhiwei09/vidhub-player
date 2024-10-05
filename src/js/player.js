import { i18n } from './i18n'
import Events from './events'
import User from './user'
import Template from './template'

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

    this.template = new Template({
      container: this.container,
      options: this.options,
      index: index,
      tran: this.tran,
    })
  }
}

export default DPlayer
