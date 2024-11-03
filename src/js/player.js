import Promise from 'promise-polyfill'

import utils from './utils'
import handleOption from './options'
import { i18n } from './i18n'
import Template from './template'
import Icons from './icons'
import Danmaku from './danmaku'
import Events from './events'
import FullScreen from './fullscreen'
import User from './user'
import Subtitle from './subtitle'
import Subtitles from './subtitles'
import Bar from './bar'
import Timer from './timer'
import Bezel from './bezel'
import Controller from './controller'
import Setting from './setting'
import Comment from './comment'
import HotKey from './hotkey'
import ContextMenu from './contextmenu'

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

    if (this.options.danmaku) {
      this.danmaku = new Danmaku({
        player: this,
        container: this.template.danmaku,
        opacity: this.user.get('opacity'),
        callback: () => {
          setTimeout(() => {
            this.template.danmakuLoading.style.display = 'none'

            // autoplay
            if (this.options.autoplay) {
              this.play()
            }
          }, 0)
        },
        error: (msg) => {
          this.notice(msg)
        },
        apiBackend: this.options.apiBackend,
        borderColor: this.options.theme,
        height: this.arrow ? 24 : 30,
        time: () => this.video.currentTime,
        unlimited: this.user.get('unlimited'),
        api: {
          id: this.options.danmaku.id,
          address: this.options.danmaku.api,
          token: this.options.danmaku.token,
          maximum: this.options.danmaku.maximum,
          addition: this.options.danmaku.addition,
          user: this.options.danmaku.user,
          speedRate: this.options.danmaku.speedRate,
        },
        events: this.events,
        tran: (msg) => this.tran(msg),
      })

      this.comment = new Comment(this)
    }

    this.setting = new Setting(this)
    this.plugins = {}

    this.docClickFun = () => {
      this.focus = false
    }

    this.containerClickFun = () => {
      this.focus = true
    }

    document.addEventListener('click', this.docClickFun, true)
    this.container.addEventListener('click', this.containerClickFun, true)

    this.paused = true

    this.timer = new Timer(this)

    this.hotkey = new HotKey(this)

    this.contextmenu = new ContextMenu(this)

    this.initVideo(this.video, (this.quality && this.quality.type) || this.options.video.type)
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

  switchVolumeIcon() {
    if (this.volume() >= 0.95) {
      this.template.volumeIcon.innerHTML = Icons.volumeUp
    } else if (this.volume() > 0) {
      this.template.volumeIcon.innerHTML = Icons.volumeDown
    } else {
      this.template.volumeIcon.innerHTML = Icons.volumeOff
    }
  }

  /**
   * Set volume
   */
  volume(percentage, nostorage, nonotice) {
    percentage = parseFloat(percentage)
    if (!isNaN(percentage)) {
      percentage = Math.max(percentage, 0)
      percentage = Math.min(percentage, 1)
      this.bar.set('volume', percentage, 'width')
      const formatPercentage = `${(percentage * 100).toFixed(0)}%`
      this.template.volumeBarWrapWrap.dataset.balloon = formatPercentage
      if (!nostorage) {
        this.user.set('volume', percentage)
      }
      if (!nonotice) {
        this.notice(
          `${this.tran('volume')} ${(percentage * 100).toFixed(0)}%`,
          undefined,
          undefined,
          'volume'
        )
      }

      this.video.volume = percentage
      if (this.video.muted) {
        this.video.muted = false
      }
      this.switchVolumeIcon()
    }

    return this.video.volume
  }

  toggle() {
    if (this.video.paused) {
      this.play()
    } else {
      this.pause()
    }
  }

  /**
   * attach event
   */
  on(name, callback) {
    this.events.on(name, callback)
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

  destroy() {
    instances.splice(instances.indexOf(this), 1)
    this.pause()
    document.removeEventListener('click', this.docClickFun, true)
    this.container.removeEventListener('click', this.containerClickFun, true)
    this.fullScreen.destroy()
    this.hotkey.destroy()
    this.contextmenu.destroy()
    this.controller.destroy()
    this.timer.destroy()
    this.video.src = ''
    this.container.innerHTML = ''
    this.events.trigger('destroy')
  }

  initMSE(video, type) {}

  initVideo(video, type) {
    this.initMSE(video, type)

    /**
     * video events
     */
    // show video time: the metadata has loaded or changed
    this.on('durationchange', () => {
      // compatibility: Android browsers will output 1 or Infinity at first
      if (video.duration !== 1 && video.duration !== Infinity) {
        this.template.dtime.innerHTML = utils.secondToTime(video.duration)
      }
    })

    // show video loaded bar: to inform interested parties of progress downloading the media
    this.on('progress', () => {
      const percentage = video.buffered.length
        ? video.buffered.end(video.buffered.length - 1) / video.duration
        : 0
      this.bar.set('loaded', percentage, 'width')
    })

    // video download error: an error occurs
    this.on('error', () => {
      if (!this.video.error) {
        // Not a video load error, may be poster load failed, see #307
        return
      }
      this.tran &&
        this.notice &&
        this.type !== 'webtorrent' &&
        this.notice(this.tran('video-failed'))
    })

    // video end
    this.on('ended', () => {
      this.bar.set('played', 1, 'width')
      if (!this.setting.loop) {
        this.pause()
      } else {
        this.seek(0)
        this.play()
      }
      if (this.danmaku) {
        this.danmaku.danIndex = 0
      }
    })

    this.on('play', () => {
      if (this.paused) {
        this.play(true)
      }
    })

    this.on('pause', () => {
      if (!this.paused) {
        this.pause(true)
      }
    })

    this.on('timeupdate', () => {
      if (!this.moveBar) {
        this.bar.set('played', this.video.currentTime / this.video.duration, 'width')
      }
      const currentTime = utils.secondToTime(this.video.currentTime)
      if (this.template.ptime.innerHTML !== currentTime) {
        this.template.ptime.innerHTML = currentTime
      }
    })

    for (let i = 0; i < this.events.videoEvents.length; i++) {
      video.addEventListener(this.events.videoEvents[i], (e) => {
        this.events.trigger(this.events.videoEvents[i], e)
      })
    }
    this.volume(this.user.get('volume'), true, true)

    if (this.options.subtitle) {
      // init old single subtitle function(sub show and style)
      this.subtitle = new Subtitle(
        this.template.subtitle,
        this.video,
        this.options.subtitle,
        this.events
      )
      // init multi subtitles function(sub update)
      if (Array.isArray(this.options.subtitle.url)) {
        this.subtitles = new Subtitles(this)
      }
      if (!this.user.get('subtitle')) {
        this.subtitle.hide()
      }
    }
  }
}

export default DPlayer
