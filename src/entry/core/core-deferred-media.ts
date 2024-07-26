import { BaseElementWithoutShadowDOM } from '@/base/BaseElement'
import deferredMediaContext, {
  type DeferredMediaContext,
} from '@/contexts/deferred-media'
import { consume } from '@lit/context'
import type Vimeo from '@vimeo/player'
import { PropertyValueMap } from 'lit'
import { customElement, property, queryAsync } from 'lit/decorators.js'
import { type YouTubePlayer } from 'youtube-player/dist/types'

const DEFERRED_MEDIA_EVENTS = {
  PAUSE: 'deferred-media::pause',
  PLAY: 'deferred-media::play',
}

const YT_PLAYER_STATE = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
}
@customElement('deferred-media')
export class DeferredMedia extends BaseElementWithoutShadowDOM {
  playing = false
  loaded = false

  @consume({ context: deferredMediaContext, subscribe: true })
  activeDeferredMedia!: DeferredMediaContext

  @property({ type: String })
  host!: string

  @property({ type: String, attribute: 'media-type' })
  mediaType!: 'external_video' | 'video'

  @property({ type: Boolean })
  autoplay!: boolean

  @property({ type: Boolean })
  controls!: boolean

  @property({ type: Boolean })
  loop!: boolean

  @property({ type: Boolean })
  muted!: boolean

  @queryAsync('[id^="Deferred-Poster-Modal-"]')
  poster!: HTMLElement

  @queryAsync('template')
  template!: Promise<HTMLTemplateElement>

  @queryAsync('video')
  video!: Promise<HTMLVideoElement>

  @queryAsync('iframe')
  iframe!: Promise<HTMLIFrameElement>

  player!: YouTubePlayer | Vimeo

  constructor() {
    super()
    this.handlePosterClick = this.handlePosterClick.bind(this)
  }

  protected updated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    super.updated(_changedProperties)
    if (this.activeDeferredMedia === this) {
      this.#loadContent()
    } else {
      this.pause(true)
    }
  }

  async connectedCallback() {
    super.connectedCallback()
    const poster = await this.poster
    poster.addEventListener('click', this.handlePosterClick)
  }

  play(): void {
    if (this.playing) return
    this.$emit(DEFERRED_MEDIA_EVENTS.PLAY)
    this.playing = true
  }

  pause(skipEvent = false): void {
    if (!skipEvent) {
      if (!this.playing) return
      this.$emit(DEFERRED_MEDIA_EVENTS.PAUSE)
    }

    this.playing = false
    skipEvent && this.#_pause()
  }

  handlePosterClick(event: Event): void {
    event.preventDefault()
    this.play()
  }

  #_pause(): Promise<void> {
    return this.#togglePlayState(false)
  }

  async #togglePlayState(play = true) {
    if (!this.loaded) return
    if (this.mediaType === 'video') {
      const $video = await this.video
      play ? $video?.play() : $video?.pause()
    } else if (this.mediaType === 'external_video') {
      if (this.host === 'youtube') {
        play
          ? (this.player as YouTubePlayer)?.playVideo()
          : (this.player as YouTubePlayer)?.pauseVideo()
      } else if (this.host === 'vimeo') {
        play ? (this.player as Vimeo)?.play() : (this.player as Vimeo)?.pause()
      }
    }
  }

  #play(): Promise<void> {
    return this.#togglePlayState(true)
  }

  async #loadContent(focus = true, replaceToggle = true) {
    if (!this.loaded) {
      this.loaded = true
      const content = document.createElement('div')
      const $template = await this.template
      $template &&
        $template.content.firstElementChild &&
        content.appendChild($template.content.firstElementChild.cloneNode(true))

      const deferredElement = content.querySelector('video, iframe')
      if (!deferredElement) return
      if (replaceToggle) {
        this.innerHTML = deferredElement.outerHTML
      } else {
        this.appendChild(deferredElement)
      }

      if (focus) (deferredElement as HTMLElement)?.focus()
      if (
        deferredElement &&
        deferredElement.nodeName == 'VIDEO' &&
        (deferredElement as HTMLVideoElement).getAttribute('autoplay')
      ) {
        ;(deferredElement as HTMLVideoElement).play()
      }
      this._initListners()
    } else {
      this.#play()
    }
  }

  async _attachHTMLVideoEvents() {
    const $video = await this.video

    if (!$video) return
    $video.addEventListener('pause', () => {
      this.playing = false
      this.pause()
    })

    $video.addEventListener('play', () => {
      this.play()
    })
  }

  async _attachYoutubeEvents() {
    const { default: YT } = await import('youtube-player')
    const iframe = await this.iframe
    if (!iframe) return

    this.player = YT(iframe, {
      playerVars: {
        autoplay: this.autoplay ? 1 : 0,
        controls: this.controls ? 1 : 0,
        loop: this.loop ? 1 : 0,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
      },
    })

    this.player.getPlayerState().then((state) => {
      this.playing = state === YT_PLAYER_STATE.PLAYING
    })

    this.player.on('stateChange', (event) => {
      switch (event.data) {
        case YT_PLAYER_STATE.PLAYING:
          this.play()
          break
        case YT_PLAYER_STATE.PAUSED:
        case YT_PLAYER_STATE.ENDED:
          this.playing = false
          this.pause()
          break
      }
    })
  }

  async _attachVimeoEvents() {
    const Vimeo = await import('@vimeo/player')
    const iframe = await this.iframe
    if (!iframe) return
    const player = new Vimeo(iframe, {
      autoplay: this.autoplay,
      controls: this.controls,
      loop: this.loop,
      muted: this.muted,
      byline: false,
      title: false,
    })

    player.on('play', () => {
      this.play()
    })

    player.on('pause', () => {
      this.playing = false
      this.pause()
    })
  }

  _initListners() {
    if (this.mediaType === 'video') {
      this._attachHTMLVideoEvents()
    }

    if (this.mediaType === 'external_video') {
      this.host === 'youtube' && this._attachYoutubeEvents()
      this.host === 'vimeo' && this._attachVimeoEvents()
    }
  }
}
