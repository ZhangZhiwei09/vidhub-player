import { i18n } from './i18n'
import handleOption from './options'
import Events from './events'
import User from './user'
import Template from './template'
import Icons from './icons'
import utils from './utils'
import Bar from './bar'

let index = 0
const instances = []

class DPlayer {
  constructor(options) {
    console.log(options)

    console.log('options')

    this.options = handleOption({
      preload: options.video.type === 'webtorrent' ? 'none' : 'metadata',
      ...options,
    })
    this.tran = new i18n(this.options.lang).tran
    this.events = new Events()
    this.user = new User(this)
    this.container = this.options.container
    this.noticeList = {}

    this.container.classList.add('dplayer')

    // 不设置弹幕
    if (!this.options.danmaku) {
      this.container.classList.add('dplayer-no-danmaku')
    }
    // 直播
    if (this.options.live) {
      this.container.classList.add('dplayer-live')
    } else {
      this.container.classList.remove('dplayer-live')
    }
    // 移动端
    if (utils.isMobile) {
      this.container.classList.add('dplayer-mobile')
    }
    this.arrow = this.container.offsetWidth <= 500
    if (this.arrow) {
      this.container.classList.add('dplayer-arrow')
    }

    this.template = new Template({
      container: this.container,
      options: this.options,
      index: index,
      tran: this.tran,
    })

    console.log(this.template, '====')

    this.video = this.template.video

    this.bar = new Bar(this.template)

    // this.bezel = new Bezel(this.template.bezel)

    this.controller = new Controller(this)
  }

  play(fromNative) {
    console.log('123123')
  }
}

export default DPlayer
