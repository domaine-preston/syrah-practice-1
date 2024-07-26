import { BaseElementWithoutShadowDOM } from '@/base/BaseElement'
import ariaLiveRegionContext from '@/contexts/aria-live-region-context'
import type { AriaLiveRegionContext } from '@/custom_typings/app'
import { consume } from '@lit/context'
import { html, nothing } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('aria-live-region')
export class LiveRegion extends BaseElementWithoutShadowDOM {
  @consume({ context: ariaLiveRegionContext, subscribe: true })
  ariaLiveRegion!: AriaLiveRegionContext

  get politeness() {
    return this.ariaLiveRegion?.politeness || 'assertive'
  }

  render() {
    if (!this.ariaLiveRegion) {
      return html`${nothing}`
    }

    return html`
      <div class="sr-only" aria-live=${this.politeness} role="status">
        ${this.ariaLiveRegion.title
          ? html`<h2>${this.ariaLiveRegion.title}</h2>`
          : nothing}
        ${this.ariaLiveRegion.message ?? nothing}
      </div>
    `
  }
}
