import { type DeferredMedia } from './core-deferred-media'
import { type ModalDialog } from './core-dialog'
import SwiperElement from '@/base/SwiperElement'
import { customElement } from 'lit/decorators.js'
import type { Swiper } from 'swiper/types'

@customElement('swiper-with-media')
export class SwiperWithMedia extends SwiperElement {
  _containerDialog!: ModalDialog | null

  swiperOptions = {
    slidesPerView: 1.5,
    breakpoints: {
      1024: {
        slidesPerView: 1,
      },
    },
    on: {
      beforeSlideChangeStart: (swiper: Swiper) => {
        this._stopMediaInSlide(swiper.slides[swiper.activeIndex])
      },
    },
  }

  _stopMediaInSlide(slide: HTMLElement) {
    const media = slide.querySelector('deferred-media') as DeferredMedia | null
    media?.pause()
  }

  connectedCallback(): void {
    super.connectedCallback()
    this._containerDialog = this.closest('modal-dialog')
    this._containerDialog?.addEventListener(
      'modal-dialog::close',
      this._handleContainerClose.bind(this)
    )
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._containerDialog?.removeEventListener(
      'modal-dialog::close',
      this._handleContainerClose.bind(this)
    )
  }

  _handleContainerClose() {
    this.swiperInstance.slides.forEach(this._stopMediaInSlide)
  }
}
