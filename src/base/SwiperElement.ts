import { BaseElementWithoutShadowDOM } from './BaseElement'
import { PropertyValueMap } from 'lit'
import { query } from 'lit/decorators.js'
import type { SwiperContainer } from 'swiper/element/bundle'
import type { SwiperOptions } from 'swiper/types'

// Docs https://swiperjs.com/element
/**
 * SwiperElement
 * @description Base class for Swiper elements, Make sure that the swiper-container element is defined in the template has *init="false"* attribute
 * @extends BaseElement
 * @abstract
 * @example
 * import SwiperElement from '@/base/SwiperElement'
 *
 * import { customElement } from 'lit/decorators.js'
 *
 *
 * @customElement('some-swiper-element')
 * export class SampleSwiper extends SwiperElement {
 *  swiperOptions = {
 *   slidesPerView: 2.5,
 *    navigation: true,
 *    breakpoints: {
 *      1024: {
 *        slidesPerView: 4,
 *      },
 *      1440: {
 *        slidesPerView: 5,
 *      },
 *    },
 *    }
 * }
 *
 **/
export abstract class SwiperElement extends BaseElementWithoutShadowDOM {
  static SWIPE_ELEMENT_TO_CHECK = 'swiper-container'
  /**
   * Swiper options
   * @type {SwiperOptions}
   * @example
   * swiperOptions = {
   *  slidesPerView: 2.5,
   *  navigation: true,
   *  breakpoints: {
   *    1024: {
   *      slidesPerView: 4,
   *    },
   *   1440: {
   *    slidesPerView: 5,
   *    },
   *  },
   * }
   */
  swiperOptions!: SwiperOptions

  @query('swiper-container')
  swiperContainer!: HTMLElement

  private async _loadAndCheckSwiper() {
    try {
      if (window.customElements.get(SwiperElement.SWIPE_ELEMENT_TO_CHECK)) {
        return this._initializeSwiper()
      }

      await window.customElements.whenDefined(
        SwiperElement.SWIPE_ELEMENT_TO_CHECK
      )
      return this._initializeSwiper()
    } catch (error) {
      console.error('Error loading Swiper:', error)
    }
  }

  get swiperInstance() {
    return (this.swiperContainer as SwiperContainer).swiper
  }

  private _initializeSwiper() {
    if (!this.swiperContainer) return console.error('No swiper container found')

    const swiperContainer = this.swiperContainer as SwiperContainer

    if (
      swiperContainer.tagName !==
      SwiperElement.SWIPE_ELEMENT_TO_CHECK.toUpperCase()
    )
      return console.error('Invalid swiper container')

    Object.assign(swiperContainer, this.swiperOptions || {})
    swiperContainer.initialize()
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    super.firstUpdated(_changedProperties)
    this._loadAndCheckSwiper()
  }

  // Refresh swiper
  protected refreshSwiper() {
    return this.swiperInstance?.update()
  }

  // Reinitialize swiper
  protected reInitialize() {
    this.swiperInstance?.destroy(true, true)
    this._initializeSwiper()
  }
}

export default SwiperElement
