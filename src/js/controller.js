import utils from './utils'

class Controller {
  constructor(player) {
    this.player = player

    this.initPlayButton()
    this.initPlayedBar()
    this.initFullButton()
    if (!utils.isMobile) {
      this.initVolumeButton()
    }
  }

  initPlayButton() {
    this.player.template.playButton.addEventListener('click', () => {
      this.player.toggle()
    })

    this.player.template.mobilePlayButton.addEventListener('click', () => {
      this.player.toggle()
    })
  }

  initPlayedBar() {
    const thumbMove = (e) => {
      // 计算进度条坐标
      let percentage =
        ((e.clientX || e.changedTouches[0].clientX) -
          utils.getBoundingClientRectViewLeft(this.player.template.playedBarWrap)) /
        this.player.template.playedBarWrap.clientWidth
      percentage = Math.max(percentage, 0)
      percentage = Math.min(percentage, 1)
      this.player.bar.set('played', percentage, 'width')
      this.player.template.ptime.innerHTML = utils.secondToTime(
        percentage * this.player.video.duration
      )
    }

    const thumbUp = (e) => {
      document.removeEventListener(utils.nameMap.dragEnd, thumbUp)
      document.removeEventListener(utils.nameMap.dragMove, thumbMove)
      let percentage =
        ((e.clientX || e.changedTouches[0].clientX) -
          utils.getBoundingClientRectViewLeft(this.player.template.playedBarWrap)) /
        this.player.template.playedBarWrap.clientWidth
      percentage = Math.max(percentage, 0)
      percentage = Math.min(percentage, 1)
      this.player.bar.set('played', percentage, 'width')
      this.player.seek(this.player.bar.get('played') * this.player.video.duration)
      this.player.moveBar = false
    }

    this.player.template.playedBarWrap.addEventListener(utils.nameMap.dragStart, () => {
      this.player.moveBar = true
      document.addEventListener(utils.nameMap.dragMove, thumbMove)
      document.addEventListener(utils.nameMap.dragEnd, thumbUp)
    })

    this.player.template.playedBarWrap.addEventListener(utils.nameMap.dragMove, (e) => {
      if (this.player.video.duration) {
        const px = this.player.template.playedBarWrap.getBoundingClientRect().left
        const tx = (e.clientX || e.changedTouches[0].clientX) - px
        if (tx < 0 || tx > this.player.template.playedBarWrap.offsetWidth) {
          return
        }
        const time =
          this.player.video.duration * (tx / this.player.template.playedBarWrap.offsetWidth)
        if (utils.isMobile) {
          this.thumbnails && this.thumbnails.show()
        }
        this.thumbnails && this.thumbnails.move(tx)
        this.player.template.playedBarTime.style.left = `${tx - (time >= 3600 ? 25 : 20)}px`
        this.player.template.playedBarTime.innerText = utils.secondToTime(time)
        this.player.template.playedBarTime.classList.remove('hidden')
      }
    })

    this.player.template.playedBarWrap.addEventListener(utils.nameMap.dragEnd, () => {
      if (utils.isMobile) {
        this.thumbnails && this.thumbnails.hide()
      }
    })

    if (!utils.isMobile) {
      this.player.template.playedBarWrap.addEventListener('mouseenter', () => {
        if (this.player.video.duration) {
          // this.thumbnails && this.thumbnails.show();
          this.player.template.playedBarTime.classList.remove('hidden')
        }
      })

      this.player.template.playedBarWrap.addEventListener('mouseleave', () => {
        if (this.player.video.duration) {
          this.thumbnails && this.thumbnails.hide()
          this.player.template.playedBarTime.classList.add('hidden')
        }
      })
    }
  }

  initFullButton() {
    this.player.template.browserFullButton.addEventListener('click', () => {
      this.player.fullScreen.toggle('browser')
    })

    this.player.template.webFullButton.addEventListener('click', () => {
      this.player.fullScreen.toggle('web')
    })
  }

  initVolumeButton() {
    const vWidth = 35
    const volumeMove = (event) => {
      const e = event || window.event
      const percentage =
        ((e.clientX || e.changedTouches[0].clientX) -
          utils.getBoundingClientRectViewLeft(this.player.template.volumeBarWrap) -
          5.5) /
        vWidth
      this.player.volume(percentage)
    }
    const volumeUp = () => {
      document.removeEventListener(utils.nameMap.dragEnd, volumeUp)
      document.removeEventListener(utils.nameMap.dragMove, volumeMove)
      this.player.template.volumeButton.classList.remove('dplayer-volume-active')
    }

    this.player.template.volumeBarWrapWrap.addEventListener('click', (event) => {
      const e = event || window.event
      const percentage =
        ((e.clientX || e.changedTouches[0].clientX) -
          utils.getBoundingClientRectViewLeft(this.player.template.volumeBarWrap) -
          5.5) /
        vWidth
      this.player.volume(percentage)
    })
    this.player.template.volumeBarWrapWrap.addEventListener(utils.nameMap.dragStart, () => {
      document.addEventListener(utils.nameMap.dragMove, volumeMove)
      document.addEventListener(utils.nameMap.dragEnd, volumeUp)
      this.player.template.volumeButton.classList.add('dplayer-volume-active')
    })
    this.player.template.volumeButtonIcon.addEventListener('click', () => {
      if (this.player.video.muted) {
        this.player.video.muted = false
        this.player.switchVolumeIcon()
        this.player.bar.set('volume', this.player.volume(), 'width')
      } else {
        this.player.video.muted = true
        this.player.template.volumeIcon.innerHTML = Icons.volumeOff
        this.player.bar.set('volume', 0, 'width')
      }
    })
  }
}

export default Controller
