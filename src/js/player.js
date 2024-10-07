import { i18n } from './i18n'
import handleOption from './options'
import Events from './events'
import FullScreen from './fullscreen'
import User from './user'
import Template from './template'
import Icons from './icons'
import utils from './utils'
import Bar from './bar'
import Bezel from './bezel'
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
    // 视频中央播放图标
    this.bezel = new Bezel(this.template.bezel)

    this.fullScreen = new FullScreen(this)

    this.controller = new Controller(this)
  }

  /**
   * Seek video
   */
  seek(time) {
    time = Math.max(time, 0)
    if (this.video.duration) {
      time = Math.min(time, this.video.duration)
    }
    if (this.video.currentTime < time) {
      this.notice(`${this.tran('ff').replace('%s', (time - this.video.currentTime).toFixed(0))}`)
    } else if (this.video.currentTime > time) {
      this.notice(`${this.tran('rew').replace('%s', (this.video.currentTime - time).toFixed(0))}`)
    }

    this.video.currentTime = time

    if (this.danmaku) {
      this.danmaku.seek()
    }

    this.bar.set('played', time / this.video.duration, 'width')
    this.template.ptime.innerHTML = utils.secondToTime(time)
  }

  play(fromNative) {
    this.paused = false
    if (this.video.paused && !utils.isMobile) {
      this.bezel.switch(Icons.play)
    }
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
    this.paused = true
    this.container.classList.remove('dplayer-loading')

    if (!this.video.paused && !utils.isMobile) {
      this.bezel.switch(Icons.pause)
    }

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

  notice(text, time = 2000, opacity = 0.8, id) {
    let oldNoticeEle
    if (id) {
      oldNoticeEle = document.getElementById(`dplayer-notice-${id}`)
      if (oldNoticeEle) {
        oldNoticeEle.innerHTML = text
      }
      if (this.noticeList[id]) {
        clearTimeout(this.noticeList[id])
        this.noticeList[id] = null
      }
    }
    if (!oldNoticeEle) {
      const notice = Template.NewNotice(text, opacity, id)
      this.template.noticeList.appendChild(notice)
      oldNoticeEle = notice
    }

    this.events.trigger('notice_show', oldNoticeEle)

    if (time > 0) {
      this.noticeList[id] = setTimeout(
        (function (e, dp) {
          return () => {
            e.addEventListener('animationend', () => {
              dp.template.noticeList.removeChild(e)
            })
            e.classList.add('remove-notice')
            dp.events.trigger('notice_hide')
            dp.noticeList[id] = null
          }
        })(oldNoticeEle, this),
        time
      )
    }
  }

  resize() {
    if (this.danmaku) {
      this.danmaku.resize()
    }
    if (this.controller.thumbnails) {
      this.controller.thumbnails.resize(
        160,
        (this.video.videoHeight / this.video.videoWidth) * 160,
        this.template.barWrap.offsetWidth
      )
    }
    this.events.trigger('resize')
  }

  speed(rate) {
    this.video.playbackRate = rate
  }
}

export default DPlayer
