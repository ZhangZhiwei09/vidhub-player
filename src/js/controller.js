class Controller {
  constructor(player) {
    this.player = player

    this.initPlayButton()
  }

  initPlayButton() {
    this.player.template.playButton.addEventListener('click', () => {
      this.player.toggle()
    })
  }
}

export default Controller
