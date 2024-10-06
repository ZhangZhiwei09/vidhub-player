import { i18n } from './i18n'
import handleOption from './options'
import Events from './events'
import User from './user'
import Template from './template'
import Icons from './icons'
import utils from './utils'
import Bar from './bar'
import Controller from './controller'

let index = 0
const instances = []

class DPlayer {
  constructor(options) {
    console.log(options)

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

    this.video = this.template.video

    this.bar = new Bar(this.template)

    // this.bezel = new Bezel(this.template.bezel)

    this.controller = new Controller(this)
  }

  play(fromNative) {
    this.paused = false

    // switch player icon
    this.template.playButton.innerHTML = Icons.pause
    this.template.mobilePlayButton.innerHTML = Icons.pause
    if (!fromNative) {
      const playedPromise = Promise.resolve(this.video.play())
      playedPromise
        .catch(() => {
          this.video.pause()
        })
        .then(() => {})
    }

    this.container.classList.remove('dplayer-paused')
    this.container.classList.add('dplayer-playing')

    console.log('play')
  }

  pause(fromNative) {
    this.template.playButton.innerHTML = Icons.play
    this.template.mobilePlayButton.innerHTML = Icons.play

    if (!fromNative) {
      this.video.pause()
    }

    this.container.classList.remove('dplayer-playing')
    this.container.classList.add('dplayer-paused')
  }

  toggle() {
    if (this.video.paused) {
      this.play()
    } else {
      this.pause()
    }
  }
}

export default DPlayer
