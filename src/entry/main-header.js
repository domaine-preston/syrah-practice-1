import { BaseElementWithoutShadowDOM } from '@/base/BaseElement'
import '@/components/mega-menu'

export class MainHeader extends BaseElementWithoutShadowDOM {
  #resizeObserver = new ResizeObserver(() => this.#setHeightCSSProperty())

  #setHeightCSSProperty() {
    const height = this.clientHeight
    document.documentElement.style.setProperty('--header-height', `${height}px`)
  }

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties)
    this.#setHeightCSSProperty()
    this.#resizeObserver.observe(this)
  }

  disconnectedCallback() {
    this.#resizeObserver.disconnect()
    super.disconnectedCallback()
  }
}

window.customElements.define('main-header', MainHeader)
